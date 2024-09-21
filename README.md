# ComfyUI Visual Area Nodes 

## Overview

This extension adds custom nodes to ComfyUI that offer enhanced control over area-based conditioning. With these nodes, you can precisely manage areas of influence by visually defining their scope. The extension also includes a compact visual panel for previewing how these areas will be positioned and scaled within the image.

The development of these nodes was heavily inspired by [**Davemane42's Custom Nodes**](https://github.com/Davemane42/ComfyUI_Dave_CustomNode), with the goal of making those nodes accessible to everyone once again.

A special thanks to the [**cozy_ex_dynamic**](https://github.com/cozy-comfyui/cozy_ex_dynamic) repository, which provided invaluable guidance on creating nodes with dynamic inputs.

## Installation

1. **Enter the custom nodes directory for ComfyUI (found in the program's installation directory)**:
   ```bash
   cd custom_nodes
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/Fuwuffyi/ComfyUI-VisualArea-Nodes.git
   ```

3. **Restart ComfyUI**

## Added Nodes

### Visual Area Prompt
A node that allows for area prompting with a graph displaying the areas affected by the conditionings.
There are three conditioning inputs when used:

- **area_conditioning_**: This is where all the different area conditionings are going to connect. Every time the user connects one, a new one is created.

The rest of the widgets within the node are used to properly define the areas of each of the area conditionings. The id widget is used to choose which area to affect, while the other widgets change the area's properties (position and dimensions)

There are also two outputs:

- **area_conditioning**: This is what all the combined conditionings and areas will result in.
- **combined_conditioning**: This is all the provided conditionings in a single conditioning.

### Visual Area Prompt "Advanced"
Same as Visual Area Prompt node, with a couple of extra inputs to influence areas in more ways.

- **global_conditioning**: It's a conditioning that will be added onto all of the other conditionings running through the node.
- **all_area_conditioning**: It's a separate conditioning, that applies to the whole image, taking into count all of the other conditionings as well.

There also is a **merge_global** toggle, to apply the **global_conditioning** to all areas, meaning it gets applied once for the whole image, and once for each area.
