"""
@author: Fuwuffy
@title: ComfyUI Visual Area Nodes
@nickname: comfy-visual-area
@version: 2.0
@project: "https://github.com/Fuwuffyi/ComfyUI-VisualArea-Nodes",
@description: This is a collection of nodes created to aid when managing area conditionings.
"""

from .nodes.visual_area_prompt_advanced import VisualAreaPromptAdvanced

NODE_CLASS_MAPPINGS = {
    "VisualAreaPromptAdvanced": VisualAreaPromptAdvanced
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VisualAreaPromptAdvanced": "Visual Area Prompt \"Advanced\""
}

WEB_DIRECTORY = "./web"
