class VisualAreaPrompt:
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "global_conditioning": ("CONDITIONING", { "tooltip": "Base conditioning. Will be applied to the whole image." }),
                "id": ("INT", { "default": 0, "min": 0, "max": 10, "step": 1, "tooltip": "The id of the conditioning settings to change." }),
                "x": ("FLOAT", { "default": 0.0, "min": 0.0, "max": 1.0, "step": 0.01, "tooltip": "The x position of the conditioning (of id)." }),
                "y": ("FLOAT", { "default": 0.0, "min": 0.0, "max": 1.0, "step": 0.01, "tooltip": "The y position of the conditioning (of id)." }),
                "width": ("FLOAT", { "default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01, "tooltip": "The width of the conditioning (of id)." }),
                "height": ("FLOAT", { "default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01, "tooltip": "The height of the conditioning (of id)." }),
                "weight": ("FLOAT", { "default": 1.0, "min": 0.0, "max": 10.0, "step": 0.01, "tooltip": "The weight applied to the conditioning (of id)." }),
            },
        }
    
    OUTPUT_TOOLTIPS = ("Area conditioning","Combined conditioning")
    RETURN_TYPES = ("CONDITIONING","CONDITIONING")
    RETURN_NAMES = ("area_conditioning","combined_conditioning")
    FUNCTION = "run_node"
    OUTPUT_NODE = False
    CATEGORY = "RegionalPrompt"

    def run_node(self, global_conditioning, **kwargs):
        # TODO: Implement this function
        print(global_conditioning)
        print(kwargs)
        return (global_conditioning, global_conditioning)

