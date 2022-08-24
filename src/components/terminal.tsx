import WasmTerminal, { fetchCommandFromWAPM } from "@wasmer/wasm-terminal";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs } from "@wasmer/wasmfs";
import React from "react";
import styles from "./terminal.module.scss";
import { fetchToWasmFs } from "./fetchToWasmFs";

interface Terminal {
  wasmTerminal: WasmTerminal;
  wasmFs: any;
}

function createTerminal(wasmFs: WasmFs): WasmTerminal {
  const fetchCommandHandler = async (command: {
    args: string[];
  }): Promise<Uint8Array> => {
    const commandName = command.args[0];
    const url = `./packages/${commandName}/${commandName}.wasm`;

    const response = await fetch(url);
    switch (response.status) {
      case 200: {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
      case 404: {
        const moduleResponse = await fetchCommandFromWAPM({
          args: command.args,
          env: {},
        });
        return await lowerI64Imports(moduleResponse);
        // throw new Error(`Program '${commandName} not found'`);
      }
      default: {
        throw new Error(`Failed to fetch '${commandName}', ${response.status}`);
      }
    }
  };

  const wasmTerminal = new WasmTerminal({
    fetchCommand: fetchCommandHandler,
    processWorkerUrl:
      "./node_modules/@wasmer/wasm-terminal/lib/workers/process.worker.js",
    wasmFs,
  });

  return wasmTerminal;
}

export default function TerminalContainer() {
  const wasmFs = new WasmFs();
  const terminalRef: any = React.useRef(null);
  let terminal = createTerminal(wasmFs);
  let start = () => {
    if (!terminal.isOpen) {
      terminal.open(terminalRef.current);
      terminal.fit();
      terminal.xterm.setOption("cursorBlink", true);
      terminal.print("🔳  Wasm Terminal Powered by Wasmer\n");
      terminal.print("type `menu` to get help\n");
    }
  };
  let restart = () => {
    terminal.destroy();
    terminal = createTerminal(wasmFs);
    start();
  };
  let list = () => {
    if (terminal.isOpen) {
      const dirinfo = wasmFs.fs.readdirSync("/");
      console.log({ dirinfo });
    }
  };
  let test = async () => {
    if (terminal.isOpen) {
      await fetchToWasmFs("./test.txt", wasmFs);
      const dirinfo = wasmFs.fs.readdirSync("/");
      console.log({ dirinfo });
      const text = wasmFs.volume.readFileSync("test.txt", {
        encoding: "utf8",
      });
      console.log(text);
    }
  };
  React.useEffect(() => {
    async function setup() {}
    setup();
    return () => {};
  }, []);

  return (
    <div>
      <div className={styles.Terminal} ref={terminalRef}></div>
      <button onClick={start}>Start</button>
      <button onClick={restart}>Restart</button>
      <button onClick={list}>List</button>
      <button onClick={test}>Test</button>
    </div>
  );
}
