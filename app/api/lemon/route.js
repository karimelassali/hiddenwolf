import { supabase } from '@/lib/supabase' // 👈 تم إرجاعه إلى supabase الأصلي
import crypto from 'crypto'
import { NextResponse } from 'next/server'

function getCoinsFromVariant(variantId) {
  const coinMap = {
    '100d1049-12e3-4a97-b5f1-1c6ab68e676c': 100,
    '922408': 100,
  }
  return coinMap[String(variantId)] || 0
}

export async function POST(req) {
  try {
    // --- التحقق من التوقيع (Signature Verification) ---
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature')
    if (!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || !signature) {
      return NextResponse.json(
        { error: 'Missing webhook secret or signature' },
        { status: 400 },
      )
    }
    const hmac = crypto.createHmac(
      'sha256',
      process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
    )
    const digest = hmac.update(rawBody).digest('hex')
    if (signature !== digest) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // --- معالجة البيانات (Process Payload) ---
    const payload = JSON.parse(rawBody)
    const { meta, data } = payload

    if (meta.event_name === 'order_created') {
      const userEmail = data.attributes?.user_email
      const variantId = data.attributes.first_order_item?.variant_id

      if (!userEmail || !variantId) {
        return NextResponse.json(
          { error: 'Missing user email or variant ID in payload' },
          { status: 400 },
        )
      }

      // --- البحث عن المستخدم (Find User) ---
      const { data: userData, error: userError } = await supabase
        .from('player_stats') // اسم جدولك
        .select('player_id') // اسم العمود
        .eq('email', userEmail)
        .single()

      if (userError) {
        console.error(`Database error finding user:`, userError)
        return NextResponse.json(
          { error: `User with email ${userEmail} not found.` },
          { status: 404 },
        )
      }

      const userId = userData.player_id // ✅ تم تصحيح الخطأ هنا
      const coins = getCoinsFromVariant(variantId)

      if (!coins) {
        return NextResponse.json(
          { error: `Invalid variant ID: ${variantId}` },
          { status: 400 },
        )
      }

      // --- تحديث قاعدة البيانات (Update Database) ---
      const { data: coinData, error: coinError } = await supabase
        .from('player_stats')
        .select('coins')
        .eq('player_id', userId)
        .single()

      if (coinError && coinError.code !== 'PGRST116') {
        throw coinError
      }

      const currentBalance = coinData?.coins || 0
      const newBalance = currentBalance + coins

      const { error: upsertError } = await supabase
        .from('player_stats')
        .update({ coins: newBalance })
        .eq('player_id', userId)

      if (upsertError) throw upsertError

    //   await supabase.from('transactions').insert({
    //     user_id: userId,
    //     lemon_squeezy_order_id: data.attributes.identifier,
    //     coins_purchased: coins,
    //     status: 'completed',
    //   })
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error) {
    console.error('Webhook caught unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}