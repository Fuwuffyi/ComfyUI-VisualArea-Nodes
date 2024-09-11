import { app } from "../../scripts/app.js";

function addNumberInput(node, inputName, startValue, updateFunc, settings = { min: 0, max: 1, step: 0.01, precision: 0.01 }) {
   node.addWidget(
      "number",
      inputName,
      startValue,
      updateFunc,
      settings
   )
}

function updateWidgetValues(node, index) {
   if (!node.properties["area_values"][index]) {
      node.properties["area_values"][index] = [];
   }
   // Return x value to widget
   const xValue = node.properties["area_values"][index][0];
   node.properties["area_values"][index][0] = xValue ? xValue : 0.0;
   node.widgets[1].value = xValue ? xValue : 0.0;
   // Return y value to widget
   const yValue = node.properties["area_values"][index][1];
   node.properties["area_values"][index][1] = yValue ? yValue : 0.0;
   node.widgets[2].value = yValue ? yValue : 0.0;
   // Return width value to widget
   const widthValue = node.properties["area_values"][index][2];
   node.properties["area_values"][index][2] = widthValue ? widthValue : 1.0;
   node.widgets[3].value = widthValue ? widthValue : 1.0;
   // Return height value to widget
   const heightValue = node.properties["area_values"][index][3];
   node.properties["area_values"][index][3] = heightValue ? heightValue : 1.0;
   node.widgets[4].value = heightValue ? heightValue : 1.0;
   // Return strength value to widget
   const strValue = node.properties["area_values"][index][4];
   node.properties["area_values"][index][4] = strValue ? strValue : 1.0;
   node.widgets[5].value = strValue ? strValue : 1.0;
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
         // Setup index for current conditioning
         this.index = 0;
         // Set properties for the elements (first is initialized because of index 0)
         this.setProperty("area_values", [[0.0, 0.0, 1.0, 1.0, 1.0]]);
         // Add base controls for conditionings
         addNumberInput(this, "id", 0, (value, _, node) => {
            this.index = value;
            updateWidgetValues(node, this.index);
         }, { min: 0, max: 0, step: 10, precision: 0 });
         // x value input, has index 0
         addNumberInput(this, "x", 0.0, (value, _, node) => {
            node.properties["area_values"][this.index][0] = value;
         }, { min: 0, max: 1, step: 0.1, precision: 2 });
         // y value input, has index 1
         addNumberInput(this, "y", 0.0, (value, _, node) => {
            node.properties["area_values"][this.index][1] = value;
         }, { min: 0, max: 1, step: 0.1, precision: 2 });
         // width value input, has index 2
         addNumberInput(this, "width", 1.0, (value, _, node) => {
            node.properties["area_values"][this.index][2] = value;
         }, { min: 0, max: 1, step: 0.1, precision: 2 });
         // height value input, has index 3
         addNumberInput(this, "height", 1.0, (value, _, node) => {
            node.properties["area_values"][this.index][3] = value;
         }, { min: 0, max: 1, step: 0.1, precision: 2 });
         // strength value input, has index 4
         addNumberInput(this, "strength", 1.0, (value, _, node) => {
            node.properties["area_values"][this.index][4] = value;
         }, { min: 0, max: 10, step: 0.1, precision: 2 });
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
               slot.name = `${name}_${count - 1}`;
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
            // Set ID widget max to correct value
            this.widgets[0].options.max = (dynamicInputs.length - 1) >= 0 ? (dynamicInputs.length - 1) : 0;
            updateWidgetValues(this, this.widgets[0].options.max);
            // Return node
            this?.graph?.setDirtyCanvas(true);
            return me;
         }
      }
      return nodeType;
   }
})
