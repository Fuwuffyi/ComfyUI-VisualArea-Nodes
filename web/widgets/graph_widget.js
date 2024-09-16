// Type of the canvas widget
const WIDGET_CANVAS_TYPE = 'fuwuffyAreaCanvas';
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
// Area border size
const AREA_BORDER_SIZE = 5;

// Function to generate an hsl color, based on a value and a maximum range
function generateHslColor(value, max, alpha = 1.0, lightness = 50) {
   if (max <= 0) {
      return `hsl(0, 0%, 0%, 1.0)`;
   }
   const hue = Math.round(((value % max) / max) * 360);
   return `hsl(${hue}, 100%, ${lightness}%, ${alpha})`;
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

export function addAreaGraphWidget(node) {
   const widget = {
      type: WIDGET_CANVAS_TYPE,
      name: "AreaConditioningCanvas",
      draw: function(ctx, node, widgetWidth, widgetY) {
         if (!node.canvasHeight) {
            computeCanvasSize(node, node.size);
         }
         // Canvas variables
         const transform = ctx.getTransform();
         const widgetHeight = node.canvasHeight;
         const imageWidth = node.properties["image_width"] || 512;
         const imageHeight = node.properties["image_height"] || 512;
         const scale = Math.min((widgetWidth - CANVAS_MARGIN * 2) / imageWidth, (widgetHeight - CANVAS_MARGIN * 2) / imageHeight);
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
         const backgroundWidth = imageWidth * scale;
         const backgroundHeight = imageHeight * scale;
         const xOffset = CANVAS_MARGIN + (backgroundWidth < widgetWidth ? (widgetWidth - backgroundWidth) / 2 - CANVAS_MARGIN : 0);
         const yOffset = CANVAS_MARGIN + (backgroundHeight < widgetHeight ? (widgetHeight - backgroundHeight) / 2 - CANVAS_MARGIN : 0);
         // Transforms the node's area values to canvas pixel dimensions
         const getDrawArea = (arr) => {
            if (!arr || arr.length < 4) {
               return [0, 0, 0, 0];
            }
            return [
               Math.min(arr[0] * backgroundWidth, backgroundWidth),
               Math.min(arr[1] * backgroundHeight, backgroundHeight),
               Math.max(0, Math.min(arr[2] * backgroundWidth, backgroundWidth - arr[0] * backgroundWidth)),
               Math.max(0, Math.min(arr[3] * backgroundHeight, backgroundHeight - arr[1] * backgroundHeight)),
            ];
         }
         // Draws a rectangle on the canvas
         const drawRect = (x, y, w, h, color) => {
            if (w <= 0 || h <= 0) {
               return;
            }
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
         const halfBorder = AREA_BORDER_SIZE / 2;
         values.forEach((v, k) => {
            // Skip selected area to draw later on top
            if (k === node.index) {
               return;
            }
            const [x, y, w, h] = getDrawArea(v);
            drawRect(widgetX + x, widgetYOffset + y, w, h, generateHslColor(k + 1, values.length, 0.3, 30));
            drawRect(widgetX + x + halfBorder, widgetYOffset + y + halfBorder, w - AREA_BORDER_SIZE, h - AREA_BORDER_SIZE, generateHslColor(k + 1, values.length, 0.3));
         });
         // Draw selected area
         const [x, y, w, h] = getDrawArea(values[node.index]);
         drawRect(widgetX + x, widgetYOffset + y, w, h, generateHslColor(node.index + 1, values.length, 1.0, 30));
         drawRect(widgetX + x + halfBorder, widgetYOffset + y + halfBorder, w - AREA_BORDER_SIZE, h - AREA_BORDER_SIZE, generateHslColor(node.index + 1, values.length));
         if (node.is_selected) {
            node.inputs.filter(input => input.name.includes(node.index)).forEach(input => {
               const link = input.link;
               if (link) {
                  const nodeId = node.graph.links[link].origin_id;
                  const connectedNode = node.graph._nodes_by_id[nodeId];
                  const [x, y] = connectedNode.pos;
                  const [w, h] = connectedNode.size;
                  drawRect(x - node.pos[0], y - node.pos[1], w, h, generateHslColor(node.index + 1, values.length, 0.5));
               }
            });
         }
      }
   }
   widget.canvas = document.createElement("canvas");
   widget.canvas.className = "fuwuffy-area-canvas";
   widget.parent = node;
   document.body.appendChild(widget.canvas);
   node.addCustomWidget(widget);
   node.onResize = size => computeCanvasSize(node, size);
   return { widget };
}
