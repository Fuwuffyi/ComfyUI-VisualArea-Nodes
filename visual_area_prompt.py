from comfy_execution.graph_utils import GraphBuilder

class VisualAreaPrompt:
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "general_conditioning": ("CONDITIONING", { "tooltip": "Base conditioning. Will be concatenated to all other conditionings." }),
                "global_conditioning": ("CONDITIONING", { "tooltip": "Base conditioning. Will be applied to the whole image once." }),
            },
            "hidden": {
                "extra_pnginfo": "EXTRA_PNGINFO", 
                "unique_id": "UNIQUE_ID"
            },
        }
    
    OUTPUT_TOOLTIPS = ("Area conditioning","Combined conditioning")
    RETURN_TYPES = ("CONDITIONING","CONDITIONING")
    RETURN_NAMES = ("area_conditioning","combined_conditioning")
    FUNCTION = "run_node"
    OUTPUT_NODE = False
    CATEGORY = "RegionalPrompt"

    def run_node(self, general_conditioning, global_conditioning, extra_pnginfo, unique_id, **kwargs):
        for node in extra_pnginfo["workflow"]["nodes"]:
            if node["id"] == int(unique_id):
                conditioning_areas = node["properties"]["area_values"]
                print(conditioning_areas)
                break
        graph = GraphBuilder()
        # TODO: Implement this graph:
        
        # general_conditioning
        # concat to all other conditionings (except global) (to: general, from: og prompt)
        
        # global_conditioning (SECOND OUTPUT!)
        # concat all other conditionings (to: (to: (to: general, from global), from prompt1), from prompt2 ...)
        
        # Apply area with percentage from conditionings
        
        # Combine all prompts (including merged global last) into one (FIRST OUTPUT!)

        return {
            "result": (global_conditioning, global_conditioning),
            "expand": graph.finalize()
        }

