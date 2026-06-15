const fs = require('fs');
let code = fs.readFileSync('client/src/hooks/useRoom.js', 'utf8');
code = code.replace(/\r\n/g, '\n'); // Normalize to unix newlines for regex to work easily

code = code.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport * as Y from 'yjs';");

code = code.replace("const remoteChanges = useRef({});", "const remoteChanges = useRef({});\n  const ydocs = useRef({});");

const joinRoomRegex = /if \(state\) \{[\s\S]*?setTabs\(state\.tabs \|\| \{\}\);/;
const replacementJoin = `if (state) {
        const parsedTabs = {};
        for (const tabId in state.tabs || {}) {
          const tabData = state.tabs[tabId];
          const ydoc = new Y.Doc();
          if (tabData.yjsState) {
            const binaryString = atob(tabData.yjsState);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            Y.applyUpdate(ydoc, bytes, 'initial');
          } else if (tabData.code) {
             ydoc.getText('monaco').insert(0, tabData.code);
          }
          ydoc.on('update', (update, origin) => {
            if (origin !== socket && origin !== 'initial') {
              socket.emit('yjs-update', { tabId, update });
            }
          });
          ydocs.current[tabId] = ydoc;
          parsedTabs[tabId] = { ...tabData, ydoc };
        }
        setTabs(parsedTabs);`;
code = code.replace(joinRoomRegex, replacementJoin);

const onTabAddedRegex = /const onTabAdded = \(\{ tab \}\) => \{[\s\S]*?setTabs\(\(prev\) => \(\{ \.\.\.prev, \[tab\.id\]: tab \}\)\);\n    \};/;
const onTabAddedReplacement = `const onTabAdded = ({ tab }) => {
      const ydoc = new Y.Doc();
      if (tab.yjsState) {
        const binaryString = atob(tab.yjsState);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, bytes, 'initial');
      }
      ydoc.on('update', (update, origin) => {
        if (origin !== socket && origin !== 'initial') {
          socket.emit('yjs-update', { tabId: tab.id, update });
        }
      });
      ydocs.current[tab.id] = ydoc;
      setTabs((prev) => ({ ...prev, [tab.id]: { ...tab, ydoc } }));
    };`;
code = code.replace(onTabAddedRegex, onTabAddedReplacement);

const onTabCodeChangeRegex = `    const onTabCodeChange = ({ tabId, code: newCode }) => {
      remoteChanges.current[tabId] = true;
      setTabs((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], code: newCode }
      }));
    };`;
const onYjsUpdateReplacement = `    const onYjsUpdate = ({ tabId, update }) => {
      const ydoc = ydocs.current[tabId];
      if (ydoc) {
        Y.applyUpdate(ydoc, new Uint8Array(update), socket);
      }
    };`;
code = code.replace(onTabCodeChangeRegex, onYjsUpdateReplacement);

code = code.replace("socket.on('tab-code-change', onTabCodeChange);", "socket.on('yjs-update', onYjsUpdate);");
code = code.replace("socket.off('tab-code-change', onTabCodeChange);", "socket.off('yjs-update', onYjsUpdate);");

const handleTabCodeChangeRegex = /const handleTabCodeChange = useCallback\([\s\S]*?\[socket\]\n  \);/;
const handleTabCodeChangeReplacement = `const handleTabCodeChange = useCallback((tabId, newCode) => {}, []);`;
code = code.replace(handleTabCodeChangeRegex, handleTabCodeChangeReplacement);

code = code.replace("activeTab,", "activeTab,\n    ydocs: ydocs.current,");

// Also apply the \r\n restoration if original code had them (but leaving it Unix is fine for JS)
fs.writeFileSync('client/src/hooks/useRoom.js', code);
console.log('patched successfully');
