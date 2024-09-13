import { app } from "../../scripts/app.js";

// Function to generate an hsl color, based on a value and a maximum range
function generateHslColor(value, max, alpha) {
   if (max <= 0) {
      return `hsl(0, 0%, 0%, 1.0)`;
   }
   const hue = Math.round(((value % max) / max) * 360);
   return `hsl(${hue}, 100%, 50%, ${alpha})`;
}

function computeCanvasSize(node, size) {
   if (node.widgets[0].last_y == null) {
      return;
   }
   const MIN_SIZE = 200;
   const widgetBaseHeight = LiteGraph.NODE_WIDGET_HEIGHT;
   const yBase = widgetBaseHeight * Math.max(node.inputs.length, node.outputs.length) + 5;
   let remainingHeight = size[1] - yBase;
   const widgetTotalHeight = node.widgets.reduce((totalHeight, widget) => {
      if (widget.type !== "areaCondCanvas") {
         totalHeight += (widget.computeSize ? widget.computeSize()[1] : widgetBaseHeight) + 5;
      }
      return totalHeight;
   }, 0);
   remainingHeight = Math.max(remainingHeight - widgetTotalHeight, MIN_SIZE);
   node.size[1] = yBase + widgetTotalHeight + remainingHeight;
   node.graph.setDirtyCanvas(true);
   // Position each widget within the canvas
   let currentY = yBase;
   node.widgets.forEach(widget => {
      widget.y = currentY;
      currentY += (widget.type === "areaCondCanvas" ? remainingHeight : (widget.computeSize ? widget.computeSize()[1] : widgetBaseHeight)) + 4;
   });
   node.canvasHeight = remainingHeight;
}

function addAreaGraphWidget(node) {
   const widget = {
      type: "areaCondCanvas",
      name: "AreaConditioningCanvas",
      draw: function(ctx, node, widgetWidth, widgetY) {
         if (!node.canvasHeight) {
            computeCanvasSize(node, node.size)
         }
         // Display variables
         const width = 900;
         const height = 900;
         const margin = 2;
         const border = 1;
         // Canvas variables
         const transform = ctx.getTransform();
         const { canvasHeight: widgetHeight } = node;
         const scale = Math.min((widgetWidth - margin * 2) / width, (widgetHeight - margin * 2) / height);
         // Get values from node
         const values = node.properties["area_values"];
         // Set canvas position and size in DOM
         Object.assign(this.canvas.style, {
            left: `${transform.e}px`,
            top: `${transform.f + (widgetY * transform.d)}px`,
            width: `${widgetWidth * transform.a}px`,
            height: `${widgetHeight * transform.d}px`,
            position: "absolute",
            zIndex: 1,
            pointerEvents: "none",
         });
         // Calculate canvas draw dimensions
         const backgroundWidth = width * scale;
         const backgroundHeight = height * scale;
         const xOffset = margin + (backgroundWidth < widgetWidth ? (widgetWidth - backgroundWidth) / 2 - margin : 0);
         const yOffset = margin + (backgroundHeight < widgetHeight ? (widgetHeight - backgroundHeight) / 2 - margin : 0);
         // Transforms the node's area values to canvas pixel dimensions
         const getDrawArea = ([x, y, w, h] = []) => [
            Math.min(x * backgroundWidth, backgroundWidth),
            Math.min(y * backgroundHeight, backgroundHeight),
            Math.max(0, Math.min(w * backgroundWidth, backgroundWidth - x * backgroundWidth)),
            Math.max(0, Math.min(h * backgroundHeight, backgroundHeight - y * backgroundHeight)),
         ];
         // Draws a rectangle on the canvas
         const drawRect = (x, y, w, h, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
         };
         // Calculate widget positions
         const widgetX = xOffset;
         const widgetYOffset = widgetY + yOffset;
         // Draw the canvas's background and border
         drawRect(widgetX - border, widgetYOffset - border, backgroundWidth + border * 2, backgroundHeight + border * 2, "#000000");
         drawRect(widgetX, widgetYOffset, backgroundWidth, backgroundHeight, globalThis.LiteGraph.NODE_DEFAULT_BGCOLOR);
         // Draw all conditioning areas
         values.forEach((v, k) => {
            // Skip selected area to draw later on top
            if (k === node.index) {
               return;
            }
            const [x, y, w, h] = getDrawArea(v);
            drawRect(widgetX + x, widgetYOffset + y, w, h, generateHslColor(k + 1, values.length, 0.3));
         });
         // Draw selected area
         const [x, y, w, h] = getDrawArea(values[node.index]);
         drawRect(widgetX + x, widgetYOffset + y, w, h, generateHslColor(node.index + 1, values.length, 0.8));
      }
   }
   widget.canvas = document.createElement("canvas");
   widget.canvas.className = "area-cond-canvas";
   widget.parent = node;
   document.body.appendChild(widget.canvas);
   node.addCustomWidget(widget);
   node.onResize = size => computeCanvasSize(node, size);
   return { widget };
}

// Adds a numerical widget to the node
function addNumberInput(node, inputName, startValue, updateFunc, settings = { min: 0, max: 1, step: 0.1, precision: 2 }) {
   node.addWidget("number", inputName, startValue, updateFunc, settings);
}

// Update widget values for a specific index
function updateWidgetValues(node, index) {
   const defaults = [0.0, 0.0, 1.0, 1.0, 1.0];
   const areaValues = node.properties["area_values"][index] || [];
   // Set the value to the index's value, or the default
   areaValues.forEach((value, i) => {
      const newValue = value || defaults[i];
      node.properties["area_values"][index][i] = newValue;
      node.widgets[i + 2].value = newValue;
   });
}

const TypeSlot = {
   Input: 1,
   Output: 2,
};

// Id of the node
const _ID = "VisualAreaPrompt";
// Prefix of the input to add
const _PREFIX = "area-conditioning_";
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
         // Add the canvas
         addAreaGraphWidget(this);
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
            // Set ID widgets to new max index to create base values
            const countDynamicInputs = this.inputs.filter((input) => input.name.includes(_PREFIX)).length;
            const newMaxIdx = (countDynamicInputs - 1) >= 0 ? (countDynamicInputs - 1) : 0;
            this.widgets[1].options.max = newMaxIdx;
            updateWidgetValues(this, newMaxIdx);
            // Restore widget values
            updateWidgetValues(this, this.index);
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
      }
      return nodeType;
   }
})
