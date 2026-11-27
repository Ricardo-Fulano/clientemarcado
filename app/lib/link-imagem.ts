export const LINK_IMAGE_BUCKET = 'mp-link-images'
export function linkImageUrl(path: unknown, owner: unknown): string | undefined {
  if(typeof path !== 'string' || typeof owner !== 'string' || !/^[a-f0-9-]{36}$/i.test(owner)) return undefined
  if(!path.startsWith(owner+'/') || !/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.webp$/i.test(path)) return undefined
  const origin=process.env.NEXT_PUBLIC_SUPABASE_URL
  if(!origin) return undefined
  return origin.replace(/\/$/,'')+'/storage/v1/object/public/'+LINK_IMAGE_BUCKET+'/'+path
}
