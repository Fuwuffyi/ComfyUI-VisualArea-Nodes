import { app } from "../../scripts/app.js";

import { addAreaGraphWidget } from "./widgets/graph_widget.js"

// Id of the node
const _ID = "VisualAreaPrompt";
// Prefix of the input to add
const _PREFIX = "area_conditioning_";
// Type of the input to add
const _TYPE = "CONDITIONING";
// Defaults for area widgets (make sure to copy, or it will be modified)
const _AREA_DEFAULTS = [0.0, 0.0, 1.0, 1.0, 1.0];

const TypeSlot = { Input: 1, Output: 2 };

// Adds a numerical widget to the node
function addNumberInput(node, inputName, startValue, updateFunc, settings = { min: 0, max: 1, step: 0.1, precision: 2 }) {
   node.addWidget("number", inputName, startValue, updateFunc, settings);
}

// Update widget values for a specific index
function updateWidgetValues(node) {
   // If that index does not exist, set it
   if (!node.properties["area_values"][node.index]) {
      node.properties["area_values"][node.index] = [];
   }
   const areaValues = node.properties["area_values"][node.index];
   // Set the value to the index's value, or the default
   [..._AREA_DEFAULTS].forEach((value, i) => {
      const newValue = areaValues[i] || value;
      node.properties["area_values"][node.index][i] = newValue;
      // Offset by five because there are five widgets that should not change (imgWidth, imgHeight, graph and id)
      node.widgets[i + 4].value = newValue;
   });
}

app.registerExtension({
   name: 'fuwuffy.' + _ID,
   async beforeRegisterNodeDef(nodeType, nodeData, app) {
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
         this.setProperty("area_values", [..._AREA_DEFAULTS]);
         // Add imageWidth and imageHeight widgets
         ["image_width", "image_height"].forEach((name, _idx) => {
            addNumberInput(this, name, 512, (value, _, node) => {
               const s = 640 / 10;
               this.value = Math.round(value / s) * s;
               node.properties[name] = this.value
            }, { min: 0, max: 4096, step: 640, precision: 0 });
         });
         // Add the canvas
         addAreaGraphWidget(app, this, "area_conditioning_canvas");
         // Add area selection control
         addNumberInput(this, "area_id", 0, (value, _, node) => {
            node.index = value;
            updateWidgetValues(node);
         }, { min: 0, max: 0, step: 10, precision: 0 });
         // Add conditioning controls
         ["x", "y", "width", "height", "conditioning_strength"].forEach((name, i) => {
            addNumberInput(this, name, [..._AREA_DEFAULTS][i], (value, _, node) => {
               node.properties["area_values"][node.index][i] = value;
            }, { min: 0, max: i === 4 ? 10 : 1, step: 0.1, precision: 2 });
         });
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
         // Skip if it's not an input
         if (slotType !== TypeSlot.Input) {
            return me;
         }
         // Get all dynamic inputs
         const dynamicInputs = this.inputs.filter((input) => input.name.includes(_PREFIX));
         // Skip if it's not a dynamic input
         if (!dynamicInputs.includes(node_slot)) {
            return me;
         }
         if (link_info && event === true) { // If connects
            // Get the parent (left side node) from the link
            const fromNode = this.graph._nodes.find(otherNode => otherNode.id == link_info.origin_id);
            if (fromNode) {
               // Make sure there is a parent for the link
               const parentLink = fromNode.outputs[link_info.origin_slot];
               if (parentLink) {
                  node_slot.type = parentLink.type;
                  node_slot.name = _PREFIX;
               }
            }
         } else if (event === false) { // If disconnects
            // Remove the input
            this.removeInput(slot_idx);
         }
         let counter = 0;
         let idx = 0;
         for (const slot of this.inputs) {
            // Skip static nodes
            if (!dynamicInputs.includes(slot)) {
               idx += 1;
               continue;
            }
            // Remove unlinked dynamic nodes
            if (slot.link === null) {
               if (this.graph) {
                  this.removeInput(idx);
               }
               continue;
            }
            idx += 1;
            // Update the slot name with the count if greater than 1
            slot.name = `${_PREFIX}${counter++}`;
         }
         // Set ID widget new max and value
         const countDynamicInputs = this.inputs.filter((input) => input.name.includes(_PREFIX)).length;
         const newMaxIdx = (countDynamicInputs - 1) >= 0 ? (countDynamicInputs - 1) : 0;
         this.widgets[3].options.max = newMaxIdx;
         this.widgets[3].value = newMaxIdx;
         this.index = newMaxIdx;
         updateWidgetValues(this);
         // Remove extra values
         this.properties["area_values"] = this.properties["area_values"].slice(0, countDynamicInputs);
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
      return nodeType;
   }
})
