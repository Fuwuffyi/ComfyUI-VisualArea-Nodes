"""
@author: Fuwuffy 
@title: Area Prompts
@nickname: AreaPrompts 
@version: 0.1
@project: "https://github.com/crystian/ComfyUI-Crystools",
@description: Nodes used for more comfortable area prompting design. 
"""

from .visual_area_prompt import VisualAreaPrompt

NODE_CLASS_MAPPINGS = {
    "VisualAreaPrompt": VisualAreaPrompt 
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VisualAreaPrompt": "Visual Area Prompt"
}
