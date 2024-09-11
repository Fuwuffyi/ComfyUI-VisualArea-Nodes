import { app } from "../../scripts/app.js";

const TypeSlot = {
   Input: 1,
   Output: 2,
};

const TypeSlotEvent = {
   Connect: true,
   Disconnect: false,
};

// List of static input indices;
const indexesToSkip = [0];

// Id of the node
const _ID = "VisualAreaPrompt";
// Prefix of the input to add
const _PREFIX = "conditioning";
// Type of the input to add
const _TYPE = "CONDITIONING";

app.registerExtension({
   name: 'fuwuffy.' + _ID,
   async beforeRegisterNodeDef(nodeType, nodeData, _app) {
      // Discard other nodes
      if (nodeData.name !== _ID) {
         return;
      }
      // On creation
      const onNodeCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = async function() {
         // Create node
         const me = onNodeCreated?.apply(this);
         // Add new input (name, type)
         this.addInput(_PREFIX, _TYPE);
         // Return node
         return me;
      }
      // When connections change
      const onConnectionsChange = nodeType.prototype.onConnectionsChange
      nodeType.prototype.onConnectionsChange = function(slotType, slot_idx, event, link_info, node_slot) {
         // Change the connections like normal
         const me = onConnectionsChange?.apply(this, arguments);
         // Only for inputs
         if (slotType === TypeSlot.Input) {
            // Skip static inputs
            if (indexesToSkip.includes(slot_idx)) {
               return me;
               // If connects
            } else if (link_info && event === TypeSlotEvent.Connect) {
               // Get the parent (left side node) from the link
               const fromNode = this.graph._nodes.find(
                  (otherNode) => otherNode.id == link_info.origin_id
               )
               if (fromNode) {
                  // Make sure there is a parent for the link
                  const parent_link = fromNode.outputs[link_info.origin_slot];
                  if (parent_link) {
                     node_slot.type = parent_link.type;
                     node_slot.name = `${_PREFIX}_`;
                  }
               }
               // If disconnects
            } else if (event === TypeSlotEvent.Disconnect) {
               // Remove the input
               this.removeInput(slot_idx);
            }
            console.log(slot_idx, link_info, node_slot);
            // Track each slot name so we can index the uniques
            let idx = 0;
            let slot_tracker = {};
            for (const slot of this.inputs) {
               // Skip the static ones
               if (indexesToSkip.includes(idx)) {
                  idx += 1;
               } else {
                  if (slot.link === null) {
                     this.removeInput(idx);
                     continue;
                  }
                  idx += 1;
                  const name = slot.name.split('_')[0];
                  // Correctly increment the count in slot_tracker
                  const count = (slot_tracker[name] || 0) + 1;
                  slot_tracker[name] = count;
                  // Update the slot name with the count if greater than 1
                  slot.name = `${name}_${count}`;
               }
            }
            // Add last input to fix the removed ones
            const last = this.inputs[this.inputs.length - 1];
            if (last === undefined || (last.name != _PREFIX || last.type != _TYPE)) {
               this.addInput(_PREFIX, _TYPE);
            }
            // Return node
            this?.graph?.setDirtyCanvas(true);
            return me;
         }
      }
      return nodeType;
   }
})
