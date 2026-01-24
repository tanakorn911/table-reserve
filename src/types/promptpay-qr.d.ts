
declare module 'promptpay-qr' {
    function generatePayload(target: string, amount?: { amount: number } | number): string;
    export = generatePayload;
}
