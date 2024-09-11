class VisualAreaPrompt:
    """
    A example node

    Class methods
    -------------
    INPUT_TYPES (dict):
        Tell the main program input parameters of nodes.
    IS_CHANGED:
        optional method to control when the node is re executed.

    Attributes
    ----------
    RETURN_TYPES (`tuple`):
        The type of each element in the output tuple.
    RETURN_NAMES (`tuple`):
        Optional: The name of each output in the output tuple.
    FUNCTION (`str`):
        The name of the entry-point method. For example, if `FUNCTION = "execute"` then it will run Example().execute()
    OUTPUT_NODE ([`bool`]):
        If this node is an output node that outputs a result/image from the graph. The SaveImage node is an example.
        The backend iterates on these output nodes and tries to execute all their parents if their parent graph is properly connected.
        Assumed to be False if not present.
    CATEGORY (`str`):
        The category the node should appear in the UI.
    DEPRECATED (`bool`):
        Indicates whether the node is deprecated. Deprecated nodes are hidden by default in the UI, but remain
        functional in existing workflows that use them.
    EXPERIMENTAL (`bool`):
        Indicates whether the node is experimental. Experimental nodes are marked as such in the UI and may be subject to
        significant changes or removal in future versions. Use with caution in production workflows.
    execute(s) -> tuple || None:
        The entry point method. The name of this method must be the same as the value of property `FUNCTION`.
        For example, if `FUNCTION = "execute"` then this method's name must be `execute`, if `FUNCTION = "foo"` then it must be `foo`.
    """
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(s):
        """
            Return a dictionary which contains config for all input fields.
            Some types (string): "MODEL", "VAE", "CLIP", "CONDITIONING", "LATENT", "IMAGE", "INT", "STRING", "FLOAT".
            Input types "INT", "STRING" or "FLOAT" are special values for fields on the node.
            The type can be a list for selection.

            Returns: `dict`:
                - Key input_fields_group (`string`): Can be either required, hidden or optional. A node class must have property `required`
                - Value input_fields (`dict`): Contains input fields config:
                    * Key field_name (`string`): Name of a entry-point method's argument
                    * Value field_config (`tuple`):
                        + First value is a string indicate the type of field or a list for selection.
                        + Second value is a config for type "INT", "STRING" or "FLOAT".
        """
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

    FUNCTION = "run"

    #OUTPUT_NODE = False

    CATEGORY = "RegionalPrompt"

    def run(self, global_conditioning, **kwargs):
        # TODO: Implement this function
        print(global_conditioning)
        print(kwargs)
        return (global_conditioning, global_conditioning)

    """
        The node will always be re executed if any of the inputs change but
        this method can be used to force the node to execute again even when the inputs don't change.
        You can make this node return a number or a string. This value will be compared to the one returned the last time the node was
        executed, if it is different the node will be executed again.
        This method is used in the core repo for the LoadImage node where they return the image hash as a string, if the image hash
        changes between executions the LoadImage node is executed again.
    """
    #@classmethod
    #def IS_CHANGED(s, image, string_field, int_field, float_field, print_to_screen):
    #    return ""

