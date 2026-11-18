import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
  disconnectSocket,
} from "../config/socket";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import { getWebContainer } from "../config/webContainer.js";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

// WebContainer requires folders to be wrapped in a `directory` property. Some
// generated projects use plain objects for folders, so normalize those before
// mounting without changing the file contents or the saved project tree.
function normalizeFileTreeForWebContainer(tree) {
  if (!tree || typeof tree !== "object" || Array.isArray(tree)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(tree).map(([name, node]) => {
      if (node?.file && typeof node.file === "object") {
        return [name, node];
      }

      if (node?.directory && typeof node.directory === "object") {
        return [name, { ...node, directory: normalizeFileTreeForWebContainer(node.directory) }];
      }

      // A node without `file` or `directory` is the legacy plain-folder shape.
      return [name, { directory: normalizeFileTreeForWebContainer(node) }];
    }),
  );
}

function inferStartCommand(fileTree) {
  const packageContents = fileTree?.["package.json"]?.file?.contents;

  if (typeof packageContents !== "string") {
    return null;
  }

  try {
    const { scripts = {} } = JSON.parse(packageContents);

    if (scripts.start) {
      return { mainItem: "npm", commands: ["run", "start"] };
    }

    if (scripts.dev) {
      const commands = ["run", "dev"];

      if (scripts.dev.includes("vite")) {
        commands.push("--", "--host", "0.0.0.0");
      }

      return { mainItem: "npm", commands };
    }
  } catch (error) {
    console.error("Unable to read the generated package.json:", error);
  }

  return null;
}

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set()); // Initialized as Set
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]); // New state variable for messages
  const [fileTree, setFileTree] = useState({});

  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);

  const [runProcess, setRunProcess] = useState(null);
  const [startCommand, setStartCommand] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const currentUserId = user?._id ? String(user._id) : null;

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }

      return newSelectedUserId;
    });
  };

  function addCollaborators() {
    axios
      .put("/projects/add-user", {
        projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const send = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    sendMessage("project-message", {
      message: trimmedMessage,
      sender: user,
    });
    setMessages((prevMessages) => [...prevMessages, { sender: user, message: trimmedMessage }]); // Update messages state
    setMessage("");
  };

  function WriteAiMessage(message) {
    const messageObject = JSON.parse(message);

    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        console.log("container started");
      });
    }

    receiveMessage("project-message", (data) => {
      console.log(data);

      if (data.sender._id == "ai") {
        const message = JSON.parse(data.message);

        console.log(message);

        webContainer?.mount(message.fileTree);

        if (message.fileTree) {
          setFileTree(message.fileTree || {});
        }

        if (message.startCommand?.mainItem && Array.isArray(message.startCommand.commands)) {
          setStartCommand(message.startCommand);
        }

        setMessages((prevMessages) => [...prevMessages, data]); // Update messages state
      } else {
        setMessages((prevMessages) => [...prevMessages, data]); // Update messages state
      }
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        console.log(res.data.project);

        setProject(res.data.project);
        setFileTree(res.data.project.fileTree || {});
      });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      disconnectSocket();
    };
  }, []);

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Removed appendIncomingMessage and appendOutgoingMessage functions

  function scrollToBottom() {
    messageBox.current.scrollTop = messageBox.current.scrollHeight;
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to workspace list"
            title="Back to workspaces"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <i className="ri-arrow-left-line text-lg"></i>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Workspace</p>
            <h1 className="truncate text-sm font-semibold text-white sm:text-base">{project?.name || "Untitled workspace"}</h1>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-3">
          <div className="hidden text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Signed in as</p><p className="max-w-56 truncate text-sm font-medium text-slate-100">{user?.email || "Loading user…"}</p></div>
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-950/40">{user?.email?.[0]?.toUpperCase() || "U"}</div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 p-3 pt-2">
      <section className="left relative flex h-full min-w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/20 md:min-w-96">
        <header className="absolute top-0 z-10 flex w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" onClick={() => setIsModalOpen(true)}>
            <i className="ri-user-add-line text-base text-indigo-600"></i>
            <p>Add collaborator</p>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area relative flex h-full flex-grow flex-col bg-slate-50 pt-16 pb-14">
          <div
            ref={messageBox}
            className="message-box flex max-h-full flex-grow flex-col gap-3 overflow-auto p-4"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message flex w-fit flex-col rounded-xl px-3 py-2 shadow-sm ${
                  msg.sender._id === "ai"
                    ? "max-w-80 border border-indigo-100 bg-indigo-50 text-slate-900"
                    : currentUserId && String(msg.sender._id) === currentUserId
                      ? "ml-auto max-w-52 border border-indigo-600 bg-indigo-600 text-white"
                      : "max-w-52 border border-slate-200 bg-white text-slate-900"
                }`}
              >
                <small className="text-xs font-medium opacity-65">{msg.sender.email}</small>
                <div className="text-sm">
                  {msg.sender._id === "ai" ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="inputField absolute bottom-0 flex w-full gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              type="text"
              placeholder="Enter message"
            />
            <button onClick={send} className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
        <div
          className={`sidePanel absolute top-0 z-20 flex h-full w-full flex-col gap-2 bg-white transition-all ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h1 className="font-semibold text-lg">Collaborators</h1>

            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-1 p-2">
            {project.users &&
              project.users.map((user) => {
                return (
                  <div key={user._id} className="user flex cursor-pointer items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50">
                    <div className="relative flex aspect-square size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      <i className="ri-user-fill absolute"></i>
                    </div>
                    <h1 className="font-semibold text-lg">{user.email}</h1>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      <section className="right flex h-full flex-grow overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/20">
        <div className="explorer h-full min-w-52 max-w-64 border-r border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Explorer</div>
          <div className="file-tree w-full">
  {Object.keys(fileTree)
    .filter((file) => fileTree[file]?.file?.contents !== undefined)
    .map((file) => (
      <button
        key={file}
        onClick={() => {
          setCurrentFile(file);
          setOpenFiles((prev) => [...new Set([...prev, file])]);
        }}
          className={`tree-element flex w-full cursor-pointer items-center gap-2 border-l-2 px-4 py-2.5 text-left text-sm font-medium transition ${
          currentFile === file ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-600 hover:bg-slate-100"
        }`}
      >
        <p className="font-semibold text-lg">{file}</p>
      </button>
    ))}
</div>
        </div>

        <div className="code-editor flex h-full flex-grow shrink flex-col">
          <div className="top flex w-full justify-between border-b border-slate-200 bg-white">
            <div className="files flex overflow-auto">
              {openFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFile(file)}
                  className={`open-file flex w-fit items-center gap-2 border-r border-slate-200 px-4 py-3 text-sm font-medium ${currentFile === file ? "bg-slate-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <p className="font-semibold text-lg">{file}</p>
                </button>
              ))}
            </div>

            <div className="actions flex items-center gap-2 px-3">
              <button
                onClick={async () => {
  try {
    setIsRunning(true);

    if (!webContainer) {
      console.error("WebContainer is not initialized");
      return;
    }

    if (!fileTree || Object.keys(fileTree).length === 0) {
      console.error("File tree is empty or invalid:", fileTree);
      return;
    }

    const normalizedFileTree = normalizeFileTreeForWebContainer(fileTree);

    console.log("Mounting file tree:", normalizedFileTree);

    await webContainer.mount(normalizedFileTree);

    const installProcess = await webContainer.spawn("npm", ["install"]);

    installProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          console.log(chunk);
        },
      }),
    );

    const installExitCode = await installProcess.exit;

    if (installExitCode !== 0) {
      console.error("Dependency installation failed.");
      return;
    }

    if (runProcess) {
      runProcess.kill();
    }

    const commandToRun = startCommand || inferStartCommand(normalizedFileTree);

    if (!commandToRun) {
      console.error("No runnable start or dev script was found in package.json.");
      return;
    }

    const tempRunProcess = await webContainer.spawn(
      commandToRun.mainItem,
      commandToRun.commands,
    );

    tempRunProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          console.log(chunk);
        },
      }),
    );

    setRunProcess(tempRunProcess);

    webContainer.on("server-ready", (port, url) => {
      console.log(port, url);
      setIframeUrl(url);
    });
  } catch (error) {
    console.error("WebContainer execution error:", error);
  } finally {
    setIsRunning(false);
  }
}}
                disabled={isRunning}
                aria-busy={isRunning}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-500 disabled:opacity-80"
              >
                <i className={`${isRunning ? "ri-loader-4-line animate-spin" : "ri-play-fill"} mr-1 inline-block`}></i>
                {isRunning ? "Preparing…" : "Run"}
              </button>
            </div>
          </div>
          <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
            {fileTree?.[currentFile]?.file?.contents !== undefined && (
              <div className="code-editor-area h-full flex-grow overflow-auto bg-slate-950">
                <pre className="hljs h-full">
                  <code
                    className="hljs h-full outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedContent = e.target.innerText;
                      const ft = {
                        ...fileTree,
                        [currentFile]: {
                          file: {
                            contents: updatedContent,
                          },
                        },
                      };
                      setFileTree(ft);
                      saveFileTree(ft);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight(
                        "javascript",
                        fileTree?.[currentFile]?.file?.contents ?? "",
                      ).value,
                    }}
                    style={{
                      whiteSpace: "pre-wrap",
                      paddingBottom: "25rem",
                      counterSet: "line-numbering",
                    }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>

        {iframeUrl && webContainer && (
          <div className="flex h-full min-w-96 flex-col border-l border-slate-200">
            <div className="address-bar border-b border-slate-200 bg-slate-50 p-2">
              <input
                type="text"
                onChange={(e) => setIframeUrl(e.target.value)}
                value={iframeUrl}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-sm">
          <div className="relative w-96 max-w-full rounded-2xl bg-white p-5 shadow-2xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list mb-16 flex max-h-96 flex-col gap-1 overflow-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`user flex cursor-pointer items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : ""}`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="relative flex size-10 aspect-square items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
      </div>
    </main>
  );
};

export default Project;
