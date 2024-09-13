import { app } from "../../scripts/app.js";

// TODO: Make these two parameters to visualize areas that are not 1:1
const IMAGE_WIDTH = 900;
const IMAGE_HEIGHT = 900;
// Type of the canvas widget
const WIDGET_CANVAS_TYPE = 'areaCondCanvas';
// Default height for all widgets
const WIDGET_BASE_HEIGHT = LiteGraph.NODE_WIDGET_HEIGHT;
// Default size for canvas widget
const CANVAS_MIN_SIZE = 200;
// Margin of the canvas
const CANVAS_MARGIN = 6;
// Border size of the canvas
const CANVAS_BORDER = 2;
// Border color of the canvas
const CANVAS_BORDER_COLOR = "#000000";
// Id of the node
const _ID = "VisualAreaPrompt";
// Prefix of the input to add
const _PREFIX = "area-conditioning_";
// Type of the input to add
const _TYPE = "CONDITIONING";
// Defaults for area widgets (make sure to copy, or it will be modified)
const _AREA_DEFAULTS = [0.0, 0.0, 1.0, 1.0, 1.0];

const TypeSlot = { Input: 1, Output: 2 };

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
   const yBase = WIDGET_BASE_HEIGHT * Math.max(node.inputs.length, node.outputs.length) + 5;
   let remainingHeight = size[1] - yBase;
   // Calculate total height of non-canvas widgets
   const widgetTotalHeight = node.widgets.reduce((totalHeight, widget) => {
      if (widget.type !== WIDGET_CANVAS_TYPE) {
         totalHeight += (widget.computeSize ? widget.computeSize()[1] : WIDGET_BASE_HEIGHT) + 5;
      }
      return totalHeight;
   }, 0);
   // Calculate canvas height
   remainingHeight = Math.max(remainingHeight - widgetTotalHeight, CANVAS_MIN_SIZE);
   node.size[1] = yBase + widgetTotalHeight + remainingHeight;
   node.graph.setDirtyCanvas(true);
   // Position each widget within the canvas
   let currentY = yBase;
   node.widgets.forEach(widget => {
      widget.y = currentY;
      currentY += (widget.type === WIDGET_CANVAS_TYPE ? remainingHeight : (widget.computeSize ? widget.computeSize()[1] : WIDGET_BASE_HEIGHT)) + 4;
   });
   node.canvasHeight = remainingHeight;
}

function addAreaGraphWidget(node) {
   const widget = {
      type: WIDGET_CANVAS_TYPE,
      name: "AreaConditioningCanvas",
      draw: function(ctx, node, widgetWidth, widgetY) {
         if (!node.canvasHeight) {
            computeCanvasSize(node, node.size)
         }
         // Canvas variables
         const transform = ctx.getTransform();
         const widgetHeight = node.canvasHeight;
         const scale = Math.min((widgetWidth - CANVAS_MARGIN * 2) / IMAGE_WIDTH, (widgetHeight - CANVAS_MARGIN * 2) / IMAGE_HEIGHT);
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
         const backgroundWidth = IMAGE_WIDTH * scale;
         const backgroundHeight = IMAGE_HEIGHT * scale;
         const xOffset = CANVAS_MARGIN + (backgroundWidth < widgetWidth ? (widgetWidth - backgroundWidth) / 2 - CANVAS_MARGIN : 0);
         const yOffset = CANVAS_MARGIN + (backgroundHeight < widgetHeight ? (widgetHeight - backgroundHeight) / 2 - CANVAS_MARGIN : 0);
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
         drawRect(widgetX - CANVAS_BORDER, widgetYOffset - CANVAS_BORDER, backgroundWidth + CANVAS_BORDER * 2, backgroundHeight + CANVAS_BORDER * 2, CANVAS_BORDER_COLOR);
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
      // Offset by two because there are two widgets that should not change (graph and id)
      node.widgets[i + 2].value = newValue;
   });
}

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
         this.setProperty("area_values", [..._AREA_DEFAULTS]);
         // Add the canvas
         addAreaGraphWidget(this);
         // Add area selection control
         addNumberInput(this, "id", 0, (value, _, node) => {
            node.index = value;
            updateWidgetValues(node);
         }, { min: 0, max: 0, step: 10, precision: 0 });
         // Add conditioning controls
         ["x", "y", "width", "height", "strength"].forEach((name, i) => {
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
         // Set ID widget new max and value
         const countDynamicInputs = this.inputs.filter((input) => input.name.includes(_PREFIX)).length;
         const newMaxIdx = (countDynamicInputs - 1) >= 0 ? (countDynamicInputs - 1) : 0;
         this.widgets[1].options.max = newMaxIdx;
         this.widgets[1].value = newMaxIdx;
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
