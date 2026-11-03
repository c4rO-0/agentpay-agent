import { StringDecoder } from 'node:string_decoder';

// One reader at a time; pause between prompts so password input is never echoed.
export function terminal({ input = process.stdin, output = process.stdout } = {}) {
  async function ask(prompt, { secret = false } = {}) {
    if (!input.isTTY) throw new Error('Provider guide requires an interactive terminal');
    output.write(`${prompt}\n> `);
    input.setRawMode(true); input.resume();
    try {
      return await new Promise((resolve, reject) => {
        let value = ''; const decoder = new StringDecoder('utf8');
        function finish(error) { input.off('data', onData); output.write('\n'); error ? reject(error) : resolve(secret ? value : value.trim()); }
        function onData(chunk) {
          for (const char of decoder.write(chunk)) {
            if (char === '\r' || char === '\n') { finish(); return; }
            if (char === '\u0003' || char === '\u0004') { finish(new Error('Guide cancelled; saved steps are kept')); return; }
            if (char === '\u007f' || char === '\b') {
              if (value) { value = [...value].slice(0, -1).join(''); if (!secret) output.write('\b \b'); }
            } else if (char >= ' ' && value.length < 4096) { value += char; if (!secret) output.write(char); }
          }
        }
        input.on('data', onData);
      });
    } finally { input.setRawMode(false); input.pause(); }
  }
  const write = text => output.write(`${text}\n`);
  const heading = text => write(`\n------------------------------------------------------------\n> ${text}\n------------------------------------------------------------`);
  return { ask, write, heading };
}
