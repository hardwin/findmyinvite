// Replacement callbacks preserve literal $&, $` and $' in audited runtime code and text.
export function appendInvitationScript(html,code){
 return html.replace('</body>',()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script></body>');
}
