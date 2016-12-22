/**
 * Utility function to generate a Id for objects
 * @return {string}
 */
export default {

    getNilUUID: function () {
        return "00000000-0000-0000-0000-000000000000"
    },

    isNilUUID: function(uuid) {
        return uuid === "00000000-0000-0000-0000-000000000000"
    }
}