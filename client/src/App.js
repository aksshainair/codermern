import axios from "axios";
import "./App.css";
import stubs from "./stubs";
import React, { useState, useEffect } from "react";
import moment from "moment";
import CodeMirror from '@uiw/react-codemirror'
import * as themes from '@uiw/codemirror-themes-all';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';

const theme = themes.tokyoNight;
const SERVER_URL = process.env.SERVER_URL

function App() {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    setCode(stubs[language]);
  }, [language]);

  useEffect(() => {
    const defaultLang = localStorage.getItem("default-language") || "cpp";
    setLanguage(defaultLang);
  }, []);

  let pollInterval;

  const handleSubmit = async () => {
    const payload = {
      language,
      code,
      input,
    };
    try {
      setOutput("");
      setStatus(null);
      setJobId(null);
      setJobDetails(null);
      const { data } = await axios.post(SERVER_URL+"/run", payload);
      if (data.jobId) {
        setJobId(data.jobId);
        setStatus("Submitted");

        // poll here
        pollInterval = setInterval(async () => {
          const { data: statusRes } = await axios.get(
            SERVER_URL+`/status`,
            {
              params: {
                id: data.jobId,
              },
            }
          );
          const { success, job, error } = statusRes;
          console.log(statusRes, job);
          if (success) {
            const { status: jobStatus, output: jobOutput } = job;
            setStatus(jobStatus);

            setJobDetails(job);
            if (jobStatus === "pending"){
              return;
            }
            setOutput(jobOutput);
            clearInterval(pollInterval);
          } else {
            console.error(error);
            setOutput(error);
            setStatus("Bad request");
            clearInterval(pollInterval);
          }
        }, 2000);
      } else {
        setOutput("Retry again.");
      }
    } catch ({ response }) {
      if (response) {
        const errMsg = response.data.err.stderr;
        setOutput(errMsg);
      } else {
        setOutput("Please retry submitting.");
      }
    }
  };

  const setDefaultLanguage = () => {
    localStorage.setItem("default-language", language);
    console.log(`${language} set as default!`);
  };

  const renderTimeDetails = () => {
    if (!jobDetails) {
      return "";
    }
    let { submittedAt, startedAt, completedAt } = jobDetails;
    let result = "";
    submittedAt = moment(submittedAt).toString();
    result += `Job Submitted At: ${submittedAt}  `;
    if (!startedAt || !completedAt) return result;
    const start = moment(startedAt);
    const end = moment(completedAt);
    const diff = end.diff(start, "seconds", true);
    result += `Execution Time: ${diff}s`;
    return result;
  };

  return (
    <div className="App">

    {/* <Home/> */}
    {/* <div className="spacer"></div> */}

      <div className="header">
        <div id="heading">Online Code Compiler</div>
        <div className="language">
          <p style={{"fontWeight":800}}>Language:</p>
          <select
            className="select"
            value={language}
            onChange={(e) => {
              const shouldSwitch = window.confirm(
                "Are you sure you want to change language? WARNING: Your current code will be lost."
              );
              if (shouldSwitch) {
                setLanguage(e.target.value);
              }
            }}
          >
            <option value="cpp">C++</option>
            <option value="py">Python</option>
          </select>
          <div>
            <button className="set-default" onClick={setDefaultLanguage}>Set Default</button>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="code-and-submit">
          <button className="submit cssbuttons-io-button" onClick={handleSubmit}>
          <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="8 -2 10 20" id="play"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"></path></svg>
            Run
          </button>
          <div className="editor-gradient">
            <CodeMirror
              className="editor"
              value={code}
              height="83vh"
              theme={theme}
              extensions={[cpp({ jsx: false }), python({ jsx: false })]}
              // autoFocus = 'true'
              // bracketMatching='true'
              
              onChange={(value, event) => {
                setCode(value);
              }}
            />
          </div>
        </div>

        <div className="result">
          <div className="input-gradient">
            <h2>Input</h2>
            <textarea
            className="input"
              onChange={(e) => {
                setInput(e.target.value);
              }}
            />
          </div>

          <div className="input-gradient">
            <h2>Status</h2>
            <div className="info">
              <p className="status" style={{ 
                "backgroundColor": status === "success" ? "rgb(92, 255, 92)" : status === "error" ? "rgb(255, 92, 92)" : status === "pending" ? "rgb(92, 217, 255)" : status === "Submitted" ? "rgb(182, 182, 182)": "rgba(0,0,0,0)",
                // "color": status === "success" ? "#004200" : status === "error" ? "#ffbdbd" : status === "pending" ? "#002aff" : "#000",
                }}>
                {status}
              </p> <br/>
              {jobId ? `Job ID: ${jobId}` : ""} <br/>
              {renderTimeDetails()}
            </div>
          </div>

          <div className="input-gradient">
            <h2>Output</h2>
            <div className="output" style={{ whiteSpace: 'pre-line' }}> 
              <p>{status==="error" ? JSON.parse(output).stderr : status==="success" ? output : ""}</p>
            </div>
          </div>
        </div>
      </div>
    {/* <div className="spacer"></div> */}
      
    </div>
  );
}

export default App;
