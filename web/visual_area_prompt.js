import { app } from "../../scripts/app.js";

const _ID = "VisualAreaPrompt";

app.registerExtension({
   name: 'fuwuffy.' + _ID,
   async beforeRegisterNodeDef(nodeType, nodeData, app) {
      if (nodeData.name !== _ID) {
         return
      }
      return nodeType;
   }
})
