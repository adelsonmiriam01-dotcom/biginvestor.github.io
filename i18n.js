// Country → language (mirror of the frontend map)
export const COUNTRY_LANG = {
  'Israel':'he','Poland':'pl','United States':'en','France':'fr','United Kingdom':'en',
  'Canada':'en','Argentina':'es','Russia':'ru','Ukraine':'ru','Germany':'de','Hungary':'en',
  'Australia':'en','South Africa':'en','Brazil':'pt','Mexico':'es','Belarus':'ru','Lithuania':'en',
  'Latvia':'en','Romania':'en','Czech Republic':'en','Austria':'de','Netherlands':'en','Belgium':'fr',
  'Sweden':'en','Switzerland':'de','Spain':'es','Italy':'it','Turkey':'en','Iran':'en','Morocco':'ar',
  'Tunisia':'ar','Egypt':'ar','Iraq':'ar','Yemen':'ar','Syria':'ar','Lebanon':'ar','India':'en',
  'China':'en','Japan':'en','New Zealand':'en','Ireland':'en','Portugal':'pt','Greece':'en',
  'Bulgaria':'en','Serbia':'en','Croatia':'en','Slovakia':'en','Slovenia':'en','Moldova':'en',
  'Georgia':'en','Azerbaijan':'en','Kazakhstan':'ru','Uzbekistan':'ru','Estonia':'en','Finland':'en',
  'Norway':'en','Denmark':'en','Other':'en'
};

export const RTL_LANGS = ['he', 'ar'];

export function resolveLanguage(country) {
  return COUNTRY_LANG[country] || 'en';
}

export const EMAIL_I18N = {
  en: {
    subject: 'Congratulations — Your Application Has Been Approved',
    greeting: 'Congratulations, {name}!',
    intro: 'We have carefully reviewed your application and are pleased to inform you that you are eligible for the restitution program.',
    body: 'Click the button below to message our contact support team and proceed with the funds transaction.',
    button: 'Contact Support',
    detailsTitle: 'Application Summary',
    labels: { fullName:'Full name', dob:'Date of birth', gender:'Gender', country:'Country', email:'Email', phone:'Phone', appId:'Application ID' },
    footer: 'This is an automated message from Hashava / IHRA. Please do not reply directly to this email. If you did not submit an application, please disregard this message.'
  },
  he: {
    subject: 'מזל טוב — בקשתך אושרה',
    greeting: 'מזל טוב, {name}!',
    intro: 'עיינו היטב בבקשתך ואנו שמחים לבשר לך כי אתה זכאי לתוכנית ההשבה.',
    body: 'לחץ על הכפתור למטה כדי לשלוח הודעה לצוות התמיכה שלנו ולהמשיך בעסקת הכספים.',
    button: 'צור קשר עם התמיכה',
    detailsTitle: 'סיכום הבקשה',
    labels: { fullName:'שם מלא', dob:'תאריך לידה', gender:'מגדר', country:'מדינה', email:'אימייל', phone:'טלפון', appId:'מזהה בקשה' },
    footer: 'הודעה אוטומטית מ-חשבת / IHRA. אין להשיב ישירות להודעה זו. אם לא הגשת בקשה, אנא התעלם מהודעה זו.'
  },
  ar: {
    subject: 'تهانينا — تمت الموافقة على طلبك',
    greeting: 'تهانينا، {name}!',
    intro: 'لقد راجعنا طلبك بعناية ويسعدنا إبلاغك بأنك مؤهل لبرنامج الاسترداد.',
    body: 'انقر على الزر أدناه لمراسلة فريق الدعم لدينا والمتابعة في معاملة الأموال.',
    button: 'اتصل بالدعم',
    detailsTitle: 'ملخص الطلب',
    labels: { fullName:'الاسم الكامل', dob:'تاريخ الميلاد', gender:'الجنس', country:'البلد', email:'البريد الإلكتروني', phone:'الهاتف', appId:'معرف الطلب' },
    footer: 'هذه رسالة آلية من حشابة / IHRA. يرجى عدم الرد مباشرة على هذه الرسالة. إذا لم تقدم طلبًا، يرجى تجاهل هذه الرسالة.'
  },
  es: {
    subject: 'Felicitaciones — Tu solicitud ha sido aprobada',
    greeting: '¡Felicitaciones, {name}!',
    intro: 'Hemos revisado cuidadosamente tu solicitud y nos complace informarte que eres elegible para el programa de restitución.',
    body: 'Haz clic en el botón de abajo para enviar un mensaje a nuestro equipo de soporte y continuar con la transacción de fondos.',
    button: 'Contactar soporte',
    detailsTitle: 'Resumen de la solicitud',
    labels: { fullName:'Nombre completo', dob:'Fecha de nacimiento', gender:'Género', country:'País', email:'Correo', phone:'Teléfono', appId:'ID de solicitud' },
    footer: 'Este es un mensaje automático de Hashava / IHRA. No respondas directamente a este correo. Si no enviaste una solicitud, ignora este mensaje.'
  },
  fr: {
    subject: 'Félicitations — Votre demande a été approuvée',
    greeting: 'Félicitations, {name} !',
    intro: "Nous avons soigneusement examiné votre demande et avons le plaisir de vous informer que vous êtes éligible au programme de restitution.",
    body: "Cliquez sur le bouton ci-dessous pour contacter notre équipe d'assistance et procéder à la transaction des fonds.",
    button: 'Contacter le support',
    detailsTitle: 'Récapitulatif de la demande',
    labels: { fullName:'Nom complet', dob:'Date de naissance', gender:'Genre', country:'Pays', email:'E-mail', phone:'Téléphone', appId:'ID de la demande' },
    footer: "Ceci est un message automatique de Hashava / IHRA. Veuillez ne pas répondre directement à cet e-mail. Si vous n'avez pas soumis de demande, veuillez ignorer ce message."
  },
  de: {
    subject: 'Herzlichen Glückwunsch — Ihr Antrag wurde genehmigt',
    greeting: 'Herzlichen Glückwunsch, {name}!',
    intro: 'Wir haben Ihren Antrag sorgfältig geprüft und freuen uns, Ihnen mitteilen zu können, dass Sie für das Restitutionsprogramm berechtigt sind.',
    body: 'Klicken Sie auf die Schaltfläche unten, um unser Support-Team zu kontaktieren und mit der Geldtransaktion fortzufahren.',
    button: 'Support kontaktieren',
    detailsTitle: 'Zusammenfassung des Antrags',
    labels: { fullName:'Vollständiger Name', dob:'Geburtsdatum', gender:'Geschlecht', country:'Land', email:'E-Mail', phone:'Telefon', appId:'Antrags-ID' },
    footer: 'Dies ist eine automatisierte Nachricht von Hashava / IHRA. Bitte antworten Sie nicht direkt auf diese E-Mail. Wenn Sie keinen Antrag gestellt haben, ignorieren Sie diese Nachricht bitte.'
  },
  ru: {
    subject: 'Поздравляем — Ваша заявка одобрена',
    greeting: 'Поздравляем, {name}!',
    intro: 'Мы внимательно рассмотрели вашу заявку и рады сообщить, что вы имеете право на участие в программе реституции.',
    body: 'Нажмите на кнопку ниже, чтобы связаться с нашей службой поддержки и продолжить транзакцию средств.',
    button: 'Связаться с поддержкой',
    detailsTitle: 'Сводка заявки',
    labels: { fullName:'Полное имя', dob:'Дата рождения', gender:'Пол', country:'Страна', email:'Эл. почта', phone:'Телефон', appId:'ID заявки' },
    footer: 'Это автоматическое сообщение от Hashava / IHRA. Пожалуйста, не отвечайте на это письмо. Если вы не подавали заявку, проигнорируйте это сообщение.'
  },
  pl: {
    subject: 'Gratulacje — Twoje zgłoszenie zostało zatwierdzone',
    greeting: 'Gratulacje, {name}!',
    intro: 'Dokładnie sprawdziliśmy Twoje zgłoszenie i z przyjemnością informujemy, że kwalifikujesz się do programu restytucji.',
    body: 'Kliknij przycisk poniżej, aby skontaktować się z naszym zespołem wsparcia i kontynuować transakcję środków.',
    button: 'Skontaktuj się z pomocą',
    detailsTitle: 'Podsumowanie zgłoszenia',
    labels: { fullName:'Pełne imię i nazwisko', dob:'Data urodzenia', gender:'Płeć', country:'Kraj', email:'E-mail', phone:'Telefon', appId:'ID zgłoszenia' },
    footer: 'To jest automatyczna wiadomość od Hashava / IHRA. Prosimy nie odpowiadać bezpośrednio na tę wiadomość. Jeśli nie składałeś zgłoszenia, zignoruj tę wiadomość.'
  },
  pt: {
    subject: 'Parabéns — A sua candidatura foi aprovada',
    greeting: 'Parabéns, {name}!',
    intro: 'Analisámos cuidadosamente a sua candidatura e temos o prazer de informar que é elegível para o programa de restituição.',
    body: 'Clique no botão abaixo para contactar a nossa equipa de suporte e prosseguir com a transação de fundos.',
    button: 'Contactar suporte',
    detailsTitle: 'Resumo da candidatura',
    labels: { fullName:'Nome completo', dob:'Data de nascimento', gender:'Género', country:'País', email:'E-mail', phone:'Telefone', appId:'ID da candidatura' },
    footer: 'Esta é uma mensagem automática da Hashava / IHRA. Por favor, não responda diretamente a este e-mail. Se não submeteu uma candidatura, ignore esta mensagem.'
  },
  it: {
    subject: 'Congratulazioni — La tua richiesta è stata approvata',
    greeting: 'Congratulazioni, {name}!',
    intro: 'Abbiamo esaminato attentamente la tua richiesta e siamo lieti di informarti che sei idoneo al programma di restituzione.',
    body: 'Clicca il pulsante qui sotto per contattare il nostro team di supporto e procedere con la transazione dei fondi.',
    button: 'Contatta il supporto',
    detailsTitle: 'Riepilogo della richiesta',
    labels: { fullName:'Nome completo', dob:'Data di nascita', gender:'Genere', country:'Paese', email:'Email', phone:'Telefono', appId:'ID richiesta' },
    footer: 'Questo è un messaggio automatico da Hashava / IHRA. Si prega di non rispondere direttamente a questa email. Se non hai inviato una richiesta, ignora questo messaggio.'
  }
};

export function getEmailStrings(lang) {
  return EMAIL_I18N[lang] || EMAIL_I18N.en;
}