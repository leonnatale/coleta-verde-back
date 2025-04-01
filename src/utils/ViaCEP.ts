const endpoint = 'https://viacep.com.br/ws';

export async function getAddressFromCEP(cep: string): Promise<any> {
    const response = await fetch(`${endpoint}/${cep}/json`);
    return await response.json().catch(() => null);
}