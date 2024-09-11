class VisualAreaPrompt:
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "optional": {
                "global_conditioning": ("CONDITIONING", { "tooltip": "Base conditioning. Will be applied to the whole image." }),
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

    def run_node(self, global_conditioning, extra_pnginfo, unique_id, **kwargs):
        # TODO: Implement this function
        for node in extra_pnginfo["workflow"]["nodes"]:
            if node["id"] == int(unique_id):
                conditioning_areas = node["properties"]["area_values"]
                print(conditioning_areas)
                break
        return (global_conditioning, global_conditioning)

