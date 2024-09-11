import { app } from "../../scripts/app.js";

function addNumberInput(node, inputName, startValue, updateFunc, settings = { min: 0, max: 1, step: 0.01, precision: 0.01 }) {
   console.log("TEST");
   node.addWidget(
      "number",
      inputName,
      startValue,
      updateFunc,
      settings
   )
}

const TypeSlot = {
   Input: 1,
   Output: 2,
};

// Id of the node
const _ID = "VisualAreaPrompt";
// Prefix of the input to add
const _PREFIX = "area-cond_";
// Type of the input to add
const _TYPE = "CONDITIONING";

app.registerExtension({
   name: 'fuwuffy.' + _ID,
   async beforeRegisterNodeDef(nodeType, nodeData, _app) {
      // Discard other nodes
      if (nodeData.name !== _ID) {
         return;
      }
      // On creation
      const onNodeCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = async function() {
         // Create node
         const me = onNodeCreated?.apply(this);
         // Add base controls for conditionings
         addNumberInput(this, "id", 0, (value, _, node) => {

         }, { min: 0, max: 10, step: 1, precision: 0, tooltip: "The id of the conditioning settings to change." });
         addNumberInput(this, "x", 0.0, (value, _, node) => {

         }, { min: 0, max: 1, step: 0.01, precision: 2, tooltip: "The x position of the conditioning (of id)." });
         addNumberInput(this, "y", 0.0, (value, _, node) => {

         }, { min: 0, max: 1, step: 0.01, precision: 2, tooltip: "The y position of the conditioning (of id)." });
         addNumberInput(this, "width", 1.0, (value, _, node) => {

         }, { min: 0, max: 1, step: 0.01, precision: 2, tooltip: "The width of the conditioning (of id)." });
         addNumberInput(this, "height", 1.0, (value, _, node) => {

         }, { min: 0, max: 1, step: 0.01, precision: 2, tooltip: "The height of the conditioning (of id)." });
         addNumberInput(this, "strength", 1.0, (value, _, node) => {

         }, { min: 0, max: 10, step: 0.01, precision: 2, tooltip: "The weight applied to the conditioning (of id)." });
         // Add first conditioning (name, type)
         this.addInput(_PREFIX, _TYPE);
         // Return node
         return me;
      }
      // When connections change
      const onConnectionsChange = nodeType.prototype.onConnectionsChange
      nodeType.prototype.onConnectionsChange = function(slotType, slot_idx, event, link_info, node_slot) {
         // Change the connections like normal
         const me = onConnectionsChange?.apply(this, arguments);
         // Get all dynamic inputs
         const dynamicInputs = this.inputs.filter((input) => input.name.includes(_PREFIX));
         // Only for inputs
         if (slotType === TypeSlot.Input) {
            // Skip non dynamic
            if (!dynamicInputs.includes(node_slot)) {
               return me;
            } else if (link_info && event === true) { // If connects
               // Get the parent (left side node) from the link
               const fromNode = this.graph._nodes.find(
                  (otherNode) => otherNode.id == link_info.origin_id
               )
               if (fromNode) {
                  // Make sure there is a parent for the link
                  const parent_link = fromNode.outputs[link_info.origin_slot];
                  if (parent_link) {
                     node_slot.type = parent_link.type;
                     node_slot.name = `${_PREFIX}_`;
                  }
               }
            } else if (event === false) { // If disconnects
               // Remove the input
               this.removeInput(slot_idx);
            }
            let slot_tracker = {};
            let idx = 0;
            for (const slot of this.inputs) {
               // Skip static nodes
               if (!dynamicInputs.includes(slot)) {
                  idx += 1;
                  continue;
               }
               // Remove unlinked dynamic nodes
               if (slot.link === null) {
                  this.removeInput(idx);
                  continue;
               }
               idx += 1;
               const name = slot.name.split('_')[0];
               // Correctly increment the count in slot_tracker
               const count = (slot_tracker[name] || 0) + 1;
               slot_tracker[name] = count;
               // Update the slot name with the count if greater than 1
               slot.name = `${name}_${count}`;
            }
            // Create a list of all dynamic inputs by filtering out static inputs.
            const dynamicIndices = this.inputs
               .map((_input, index) => ({ index: index, input: _input }))
               .filter((obj) => dynamicInputs.includes(obj.input))
               .map((obj) => obj.index);
            // Find the last dynamic input index
            const lastDynamicInputIndex = dynamicIndices[dynamicIndices.length - 1];
            const lastDynamicInput = this.inputs[lastDynamicInputIndex];
            // Check if last dynamic input is defined and matches the prefix/type
            if (lastDynamicInput === undefined || (lastDynamicInput.name !== _PREFIX || lastDynamicInput.type !== _TYPE)) {
               // Add last input to fix the removed ones
               this.addInput(_PREFIX, _TYPE);
            }
            // Return node
            this?.graph?.setDirtyCanvas(true);
            return me;
         }
      }
      return nodeType;
   }
})
