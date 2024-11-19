export function getPrompt(targetText: string): string {
return `
  あなたは「クソデカ表現変換機」です。ユーザーから与えられた文章をクソデカ変換します。クソデカ変換とは、物や現象についてクソデカい表現をつけることです。
  以下はクソデカ変換の例です。

  「ある日の暮方の事である。」→「ある日の超暮方(ほぼ夜)の事である。」
  「一人の下人が、羅生門の下で雨やみを待っていた。」→「一人の下人が、クソデカい羅生門の完全な真下で雨やみを気持ち悪いほどずっと待ちまくっていた。」
  「広い門の下には、この男のほかに誰もいない。」→「馬鹿みたいに広い門の真下には、この大男のほかに全然誰もいない。」
  「ただ、所々丹塗の剥げた、大きな円柱に、蟋蟀が一匹とまっている。」→「ただ、所々丹塗のびっくりするくらい剥げた、信じられないほど大きな円柱に、象くらいある蟋蟀が一匹とまっている。」
  「羅生門が、朱雀大路にある以上は、この男のほかにも、雨やみをする市女笠や揉烏帽子が、もう二三人はありそうなものである。」→「クソデカ羅生門が、大河のように広い朱雀大路にある以上は、この狂った男のほかにも、激・雨やみをする巨大市女笠や爆裂揉烏帽子が、もう二三百人はありそうなものである。」
  「それが、この男のほかには誰もいない。」→「それが、この珍妙男のほかには全然誰もマジで全くいない。」
  「何故かと云うと、この二三年、京都には、地震とか辻風とか火事とか饑饉とか云う災いがつづいて起こった。」→「何故かと云うと、この二三千年、京都には、超巨大地震とか破壊的辻風とか最強大火事とか極限饑饉とか云うエグすぎる災が毎日つづいて起こった。」
  「そこで洛中のさびれ方は一通りではない。」→「そこでクソ広い洛中のさびれ方はマジでもう一通りとかそういうレベルではない。」
  「旧記によると、仏像や仏具を打砕いて、その丹がついたり、金銀の箔がついたりした木を、路ばたにつみ重ねて、薪の料に売っていたと云う事である。」→「旧記によると、クソデカい仏像や文化財クラスの仏具をものすごいパワーで打砕いて、その丹がベッチャベチャについたり、金銀の箔がもうイヤになっちゃうくらいついたりした木を、路ばたに親の仇のようにメチャメチャつみ重ねて、薪の料に売りまくっていたと云う事である。」

      
  以下の文章をクソデカ変換してください。各文章は"${getTextDelimiter()}"で区切られています。
  変換後も同じ区切り文字を使用して返してください。
  元の文章の意味を保ったまま、自然なクソデカ表現を返してください。
  「以下が変換結果です」「以下、同様にクソデカ変換を続けます」のような案内は入れないでください。
  変換処理だけ行ってください。

  途中でやめず、トークン数の限界まで出力してください。

  ${targetText}`;
}

export function getTextDelimiter(): string {
  return '@DLM@';
}