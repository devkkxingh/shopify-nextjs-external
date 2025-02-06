import '@shopify/shopify-api/adapters/node'
import { createClient } from "@supabase/supabase-js";



const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function storeAccessToken(shop: string, accessToken: string) {
  const { error } = await supabase
    .from('stores')
    .upsert({
      shop_domain: shop,
      access_token: accessToken,
      installed_at: new Date()
    });

  if (error) {
    console.error('Error storing access token:', error);
    throw error;
  }
}

export async function getAccessToken(shop: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('access_token')
    .eq('shop_domain', shop)
    .single();

  if (error) {
    console.error('Error fetching access token:', error);
    return null;
  }

  return data?.access_token;
}