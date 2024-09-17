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
// Values used to generate a grid on the canvas
const CANVAS_GRID_VALUES = Array.from({ length: 21 }, (_, i) => i / 20);
// Area border size
const AREA_BORDER_SIZE = 3;

// Convert an rgb hex color to hsl
function hexToHsl(hex) {
   const r = parseInt(hex.slice(1, 3), 16) / 255;
   const g = parseInt(hex.slice(3, 5), 16) / 255;
   const b = parseInt(hex.slice(5, 7), 16) / 255;
   const max = Math.max(r, g, b), min = Math.min(r, g, b);
   let h, s, l = (max + min) / 2;
   if (max === min) {
      h = s = 0;
   } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
         case r: h = (g - b) / d + (g < b ? 6 : 0); break;
         case g: h = (b - r) / d + 2; break;
         case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
   }
   h = Math.round(h * 360);
   s = Math.round(s * 100);
   l = Math.round(l * 100);
   return `hsl(${h}, ${s}%, ${l}%)`;
}

// Darkens an hsl color value
function brightenHsl(hsl, amount) {
   const colorMatches = hsl.match(/[\d.]+/g);
   let [h, s, l, a = 1] = colorMatches ? colorMatches.map(Number) : [300, 100, 50];
   l = Math.min(100, Math.max(0, l * amount));
   return `hsl(${h}, ${s}%, ${l}%, ${a})`;
}

// Function to generate an hsl color, based on a value and a maximum range
function generateHslColor(value, max, alpha = 1.0) {
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

export function addAreaGraphWidget(app, node, name) {
   const widget = {
      type: WIDGET_CANVAS_TYPE,
      name: name,
      draw: function(ctx, node, widgetWidth, widgetY) {
         if (!node.canvasHeight) {
            computeCanvasSize(node, node.size);
         }
         // Canvas variables
         const visible = app.canvas.ds.scale > 0.5;
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
            display: visible ? "block" : "none"
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
         // Color stuff
         const backgroundColor = hexToHsl(globalThis.LiteGraph.WIDGET_BGCOLOR);
         const borderColor = hexToHsl(globalThis.LiteGraph.WIDGET_OUTLINE_COLOR);
         // Draw the canvas's background and border
         drawRect(widgetX - CANVAS_BORDER, widgetYOffset - CANVAS_BORDER, backgroundWidth + CANVAS_BORDER * 2, backgroundHeight + CANVAS_BORDER * 2, borderColor);
         drawRect(widgetX, widgetYOffset, backgroundWidth, backgroundHeight, backgroundColor);
         if (!visible) {
            return;
         }
         // Draw a grid
         for (const value of CANVAS_GRID_VALUES) {
            const [x1, y1, w1, h1] = getDrawArea([value, 0.0, 0.002, 1.0]);
            const [x2, y2, w2, h2] = getDrawArea([0.0, value, 1.0, 0.002]);
            drawRect(widgetX + x1, y1 + widgetYOffset, w1, h1, brightenHsl(backgroundColor, 0.6));
            drawRect(widgetX + x2, y2 + widgetYOffset, w2, h2, brightenHsl(backgroundColor, 0.6));
         }
         // Draw all conditioning areas
         const halfBorder = AREA_BORDER_SIZE / 2;
         values.forEach((v, k) => {
            // Skip selected area to draw later on top
            if (k === node.index) {
               return;
            }
            const [x, y, w, h] = getDrawArea(v);
            const areaColor = generateHslColor(k + 1, values.length, 0.3, 30);
            drawRect(widgetX + x, widgetYOffset + y, w, h, brightenHsl(areaColor, 0.7));
            drawRect(widgetX + x + halfBorder, widgetYOffset + y + halfBorder, w - AREA_BORDER_SIZE, h - AREA_BORDER_SIZE, areaColor);
         });
         // Draw selected area
         const [x, y, w, h] = getDrawArea(values[node.index]);
         const areaColor = generateHslColor(node.index + 1, values.length);
         drawRect(widgetX + x, widgetYOffset + y, w, h, brightenHsl(areaColor, 0.7));
         drawRect(widgetX + x + halfBorder, widgetYOffset + y + halfBorder, w - AREA_BORDER_SIZE, h - AREA_BORDER_SIZE, areaColor);
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
   widget.canvas.style.display = "none";
   widget.parent = node;
   document.body.appendChild(widget.canvas);
   node.addCustomWidget(widget);
   node.onResize = size => computeCanvasSize(node, size);
   return { widget };
}
