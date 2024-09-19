"""
@author: Fuwuffy 
@title: Area Prompts
@nickname: AreaPrompts 
@version: 0.1
@project: "https://github.com/crystian/ComfyUI-Crystools",
@description: Nodes used for more comfortable area prompting design. 
"""

from .nodes.visual_area_prompt_advanced import VisualAreaPromptAdvanced

NODE_CLASS_MAPPINGS = {
    "VisualAreaPromptAdvanced": VisualAreaPromptAdvanced
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VisualAreaPromptAdvanced": "Visual Area Prompt \"Advanced\""
}

WEB_DIRECTORY = "./web"
