
export default {
    post: {
        input: {}, // Schema
        output: {}, // Schema
        auth: [], // Required auth
        handler: async (input: any) => {
            return {input};
        },
    }
};