import { app } from "../../scripts/app.js";

// Function to generate an hsl color, based on a value and a maximum range
function generateHslColor(value, max) {
   if (max <= 0) {
      return `hsl(0, 0%, 0%, 1.0)`;
   }
   const hue = Math.round(((value % max) / max) * 360);
   return `hsl(${hue}, 100%, 50%, 0.2)`;
}

function computeCanvasSize(node, size) {
   if (node.widgets[0].last_y == null) {
      return;
   }
   const MIN_SIZE = 200;
   const widgetBaseHeight = LiteGraph.NODE_WIDGET_HEIGHT;
   const yBase = widgetBaseHeight * Math.max(node.inputs.length, node.outputs.length) + 5;
   let remainingHeight = size[1] - yBase;
   let widgetTotalHeight = 0;
   // Calculate total height for all non-custom widgets
   for (const widget of node.widgets) {
      if (widget.type !== "areaCondCanvas") {
         widgetTotalHeight += (widget.computeSize ? widget.computeSize()[1] : widgetBaseHeight) + 5;
      }
   }
   // Adjust remaining height and node size if needed
   remainingHeight -= widgetTotalHeight;
   if (remainingHeight < MIN_SIZE) {
      remainingHeight = MIN_SIZE;
      node.size[1] = yBase + widgetTotalHeight + remainingHeight;
      node.graph.setDirtyCanvas(true);
   }
   // Position each widget within the canvas
   let currentY = yBase;
   for (const widget of node.widgets) {
      widget.y = currentY;
      currentY += (widget.type === "areaCondCanvas" ? remainingHeight : (widget.computeSize ? widget.computeSize()[1] : widgetBaseHeight)) + 4;
   }
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
         const t = ctx.getTransform();
         const margin = 2;
         const border = 1;
         const widgetHeight = node.canvasHeight;
         const values = node.properties["area_values"];
         const width = 900;
         const height = 900;
         const scale = Math.min((widgetWidth - margin * 2) / width, (widgetHeight - margin * 2) / height);
         Object.assign(this.canvas.style, {
            left: `${t.e}px`,
            top: `${t.f + (widgetY * t.d)}px`,
            width: `${widgetWidth * t.a}px`,
            height: `${widgetHeight * t.d}px`,
            position: "absolute",
            zIndex: 1,
            pointerEvents: "none",
         });
         const backgroudWidth = width * scale;
         const backgroundHeight = height * scale;
         let xOffset = margin;
         if (backgroudWidth < widgetWidth) {
            xOffset += (widgetWidth - backgroudWidth) / 2 - margin;
         }
         let yOffset = margin
         if (backgroundHeight < widgetHeight) {
            yOffset += (widgetHeight - backgroundHeight) / 2 - margin;
         }
         const getDrawArea = (v) => {
            let x = v[0] * backgroudWidth
            let y = v[1] * backgroundHeight
            let w = v[2] * backgroudWidth
            let h = v[3] * backgroundHeight
            if (x > backgroudWidth) {
               x = backgroudWidth
            }
            if (y > backgroundHeight) {
               y = backgroundHeight
            }
            if (x + w > backgroudWidth) {
               w = Math.max(0, backgroudWidth - x)
            }
            if (y + h > backgroundHeight) {
               h = Math.max(0, backgroundHeight - y)
            }
            return [x, y, w, h]
         }
         let widgetX = xOffset
         widgetY = widgetY + yOffset
         ctx.fillStyle = "#000000"
         ctx.fillRect(widgetX - border, widgetY - border, backgroudWidth + border * 2, backgroundHeight + border * 2)
         ctx.fillStyle = globalThis.LiteGraph.NODE_DEFAULT_BGCOLOR
         ctx.fillRect(widgetX, widgetY, backgroudWidth, backgroundHeight);
         for (const [k, v] of values.entries()) {
            const [x, y, w, h] = getDrawArea(v);
            ctx.fillStyle = generateHslColor(k + 1, values.length);
            ctx.fillRect(widgetX + x, widgetY + y, w, h);
         }
      }
   }
   widget.canvas = document.createElement("canvas");
   widget.canvas.className = "area-cond-canvas";
   widget.parent = node;
   document.body.appendChild(widget.canvas);
   node.addCustomWidget(widget);
   node.onResize = function(size) {
      computeCanvasSize(node, size);
   }
   return {
      widget
   };
}

function addNumberInput(node, inputName, startValue, updateFunc, settings = { min: 0, max: 1, step: 0.1, precision: 2 }) {
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
   node.widgets[2].value = xValue ? xValue : 0.0;
   // Return y value to widget
   const yValue = node.properties["area_values"][index][1];
   node.properties["area_values"][index][1] = yValue ? yValue : 0.0;
   node.widgets[3].value = yValue ? yValue : 0.0;
   // Return width value to widget
   const widthValue = node.properties["area_values"][index][2];
   node.properties["area_values"][index][2] = widthValue ? widthValue : 1.0;
   node.widgets[4].value = widthValue ? widthValue : 1.0;
   // Return height value to widget
   const heightValue = node.properties["area_values"][index][3];
   node.properties["area_values"][index][3] = heightValue ? heightValue : 1.0;
   node.widgets[5].value = heightValue ? heightValue : 1.0;
   // Return strength value to widget
   const strValue = node.properties["area_values"][index][4];
   node.properties["area_values"][index][4] = strValue ? strValue : 1.0;
   node.widgets[6].value = strValue ? strValue : 1.0;
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
            // Set ID widget max to correct value
            const countDynamicInputs = this.inputs.filter((input) => input.name.includes(_PREFIX)).length;
            const newMaxIdx = (countDynamicInputs - 1) >= 0 ? (countDynamicInputs - 1) : 0;
            this.index = newMaxIdx;
            this.widgets[1].options.max = this.index;
            this.widgets[1].value = this.index;
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
