// Dados reais do faturamento; não armazenamos endereço no Supabase.
export const addressFields=['phone','postalCode','address','addressNumber','province'] as const
export type CardAddress=Record<typeof addressFields[number],string>
export function parseCardAddress(input:unknown):CardAddress|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null
 const raw=input as Record<string,unknown>;const read=(key:string)=>typeof raw[key]==='string'?(raw[key] as string).trim():''
 const phone=read('phone').replace(/\D/g,'');const postalCode=read('postalCode').replace(/\D/g,'');const address=read('address'),addressNumber=read('addressNumber'),province=read('province')
 if(!/^[1-9]\d{9,10}$/.test(phone)||!/^\d{8}$/.test(postalCode)||postalCode==='00000000'||address.length<3||address.length>150||!addressNumber||addressNumber.length>20||province.length<2||province.length>100)return null
 return {phone,postalCode,address,addressNumber,province}
}
export function completeCustomer(c:any){return !!c&&!!parseCardAddress(c)&&((typeof c.city==='number'&&Number.isInteger(c.city)&&c.city>0)||(typeof c.city==='string'&&c.city.trim().length>0&&c.city!=='0'))}
