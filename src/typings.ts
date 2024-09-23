export type CommonError = {
    status: number;
    message: string;
};

export type CommonResult = {
    message: string;
};

export type WaifuError = {
    name: string;
    message: string;
    status: number;
};

export type WaifuResponse = {
    token: string;
    url: string;
};
