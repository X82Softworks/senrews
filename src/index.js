import crypto from 'crypto';
const userEmailAddressRegex = /^([^@]+)@(.+)/,
    nameAndEmailRegex = /^([^<]+)\s*<([^>]*)>/,
    emailAngleRegex = /^<([^>]*)>/,
    isEmailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    quotedNameAndEmailRegex = /^"([^"]*)"\s*<([^>]*)>/,
    SRS0AddressRegex = /^SRS0[=+-]([0-9a-fA-F]{4})[=+-]([0-9A-Za-z]{2})[=+-]([^=+-]+)[=+-]([^@]+)@(.+)/,
    guardedExtractRegex = /^SRS1[=+-][0-9a-fA-F]{4}[=+-][^=+-]+(.*)/,
    SRS1AddressRegex = /^SRS1[=+-]([0-9a-fA-F]{4})[=+-]([^=+-]+)[=+-][=+-]([0-9a-fA-F]{4})[=+-]([0-9A-Za-z]{2})[=+-]([^=+-]+)[=+-]([^@]+)@(.+)/,
    base32Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    firstCharBase32Mask = 0xFFFFFFE0,
    secondCharBase32Mask = 0x0000001F,
    SPACE = ' ';
/**
 * Creates the HHH HMAC secret for SRS
 * @private
 * @method createHHH
 * @param  {String}  secret
 * @param  {Array}  hashArgs Additional arguments to add to hash
 * @return {String}           
 */
function createHHH(secret, hashArgs) {
    const hmac = crypto.createHmac('sha1', secret);
    //Unfortunately the creation of the HHH is not rigid, and sometimes we will be using a previous hash in our hash in which case we 
    //won't have a timestamp to use.
    hashArgs.forEach(function (data) {
        hmac.update(data);
    });
    //Only take the first 4 digits
    return hmac.digest('base64')
        .slice(0, 4);
}
/**
 * Creates the TT timestamp
 * @private
 * @method createTT
 * @return {String}
 */
function createTT() {
    //((Unix Time)/ (60*60*24)) mod 2^10
    //We use the double tilde to coerce to an integer
    const TT = ~~((Date.now() / 86400) % 1024);
    return base32Alphabet[(TT & firstCharBase32Mask) >> 5] + base32Alphabet[TT & secondCharBase32Mask];
}
/**
 * Checks if an email address is an SRS0 type
 * @private
 * @param  {String} address
 * @return {Boolean}
 */
function isSRS0(address) {
    return SRS0AddressRegex.test(address);
}
/**
 * Checks if an email address is an SRS1 type
 * @private
 * @param  {String} address
 * @return {Boolean}
 */
function isSRS1(address) {
    return SRS1AddressRegex.test(address);
}
/**
 * Combines an email address back into one. Eg Auxolust and auxolust@gmail.com => "Auxolust" <auxolust@gmail.com>
 * @public
 * @method
 * @method combineEmail
 * @param  {String}     title
 * @param  {String}     emailAddress
 * @return {String}        
 */
function combineEmail(title, emailAddress) {
    //Strip double quotes
    title = title.replace('"', '');
    if (title) {
        return `"${title}" <${emailAddress}>`;
    } else {
        return emailAddress;
    }
}
/**
 * Does a hacky check to find the seperator in an SRS email
 * @private
 * @method dirtyCheckSeperator
 * @param  {String} emailString
 * @return {String} Seperator use
 */
function dirtyCheckSeperator(emailString) {
    if (emailString.indexOf('=') !== -1) {
        return '=';
    }
    if (emailString.indexOf('+') !== -1) {
        return '+';
    }
    if (emailString.indexOf('-') !== -1) {
        return '-';
    }
}
/**
 * Extracts the titles from email addresses
 * @public
 * @method 
 * @param  {String}     emailAddress
 * @param  {Boolean}     [keepQuotes] If truthy then keeps quotes if address is in form  "disjointed username" <user@email.com>
 * @return {String}
 */
function extractTitle(emailAddress, keepQuotes) {
    let executedRegex,
        lastIndex;
    //Extract just the mail if in the form " disjointed username" <user@email.com>
    if (executedRegex = quotedNameAndEmailRegex.exec(emailAddress)) {
        if (keepQuotes) {
            return `"${executedRegex[1]}"`;
        }
        return executedRegex[1].trim();
    }
    //Extract just the mail if in the form username <user@email.com>
    if (executedRegex = nameAndEmailRegex.exec(emailAddress)) {
        return executedRegex[1].trim();
    }
    //Check if  ie space seperated 
    if ((lastIndex = emailAddress.lastIndexOf(SPACE)) !== -1) {
        return emailAddress.slice(0, lastIndex)
            .trim();
    }
    //Assume normal

    return '';
}
/**
 * extractEmail Extracts the email portion of an email address ignoring titles
 * @public
 * @method
 * @param  {String}     emailAddress
 * @return {String}
 */
function extractEmail(emailAddress) {
    let executedRegex, sliceIndex;
    //Extract just the mail if in the form " disjointed username" <user@email.com>
    if (executedRegex = quotedNameAndEmailRegex.exec(emailAddress)) {
        return executedRegex[2];
    }
    //Extract just the mail if in the form username <user@email.com>
    if (executedRegex = nameAndEmailRegex.exec(emailAddress)) {
        return executedRegex[2];
    }
    if (executedRegex = emailAngleRegex.exec(emailAddress)) {
        return executedRegex[1];
    }
    //Extract just the mail if in the form username user@email.com
    if ((sliceIndex = emailAddress.lastIndexOf(SPACE)) !== -1) {
        return emailAddress.slice(sliceIndex + 1)
            .trim();
    }
    //Assume normal
    return emailAddress;
}
/**
 * Creates an SRS compliant string for your from/source of an email based on your sending domain
 * @public
 * @method
 * @param  {String} receievedEmailAddress 
 * @param  {String} senderDomain          
 * @param  {String} secret    
 * @param  {String} [separator] The separator character you want to use.Default \"=\"                          
 * @return {String}
 */
function forward(receievedEmailAddress, senderDomain, secret, separator) {
    separator || (separator = '=');
    if (!secret) {
        throw new Error('A secret is require to perform SRS');
    }
    if ('=+-'.indexOf(separator) === -1) {
        throw new Error('InAdmissible separator supplied, must be "=" ,  "+", or  "-" ');
    }
    //Get the timestamp
    let title = extractTitle(receievedEmailAddress),
        SRSRewritten,
        regexExtracted;
    receievedEmailAddress = extractEmail(receievedEmailAddress);
    if (title) {
        title = `"${title}"`;
    }
    //Check to see the original is already from an SRS0
    if (isSRS0(receievedEmailAddress)) {
        //Then we need to create a guarded scheme ie 
        //SRS1=HHH=forward.com==HHH=TT=original.com=user@us.com
        regexExtracted = SRS0AddressRegex.exec(receievedEmailAddress);
        //SRS0=HHH=TT=original.com=user@forward.com
        // 1.   `HHH`
        // 2.   `TT`
        // 3.   `original.com`
        // 4.   `user`
        // 5.   `forward.com`
        //Hashs is us.com + HHH=TT=original.com=user@forward.com
        let hhh = createHHH(secret, [senderDomain, receievedEmailAddress.slice(4)]);
        SRSRewritten = 'SRS1' + separator + hhh + separator + regexExtracted[5] + separator + separator + regexExtracted[1] + separator + regexExtracted[2] + separator + regexExtracted[3] + separator + regexExtracted[4] + '@' + senderDomain;
    } else if (isSRS1(receievedEmailAddress)) {
        //We need to update the current guarded scheme
        //SRS1=HHH=forward.com==HHH=TT=source.com=user@bouncer.com
        // 1.   `HHH`
        // 2.   `forward.com`
        // 3.   `HHH`
        // 4.   `TT`
        // 5.   `source.com`
        // 6.   `user`
        // 7.   `bouncer.com`
        //SRS1=HHH=forward.com==HHH=TT=source.com=user@us.com
        regexExtracted = SRS1AddressRegex.exec(receievedEmailAddress);
        let hhh = createHHH(secret, [senderDomain, guardedExtractRegex.exec(receievedEmailAddress)[1]]);
        SRSRewritten = 'SRS1' + separator + hhh + separator + regexExtracted[2] + separator + separator + regexExtracted[3] + separator + regexExtracted[4] + separator + regexExtracted[5] + '@' + senderDomain;
    } else {
        let TT = createTT();
        // 1.   `user`
        // 2.   `host.com`
        regexExtracted = userEmailAddressRegex.exec(receievedEmailAddress);
        //SRS0=HHH=TT=original.com=user@us.com
        let hhh = createHHH(secret, [senderDomain, regexExtracted[2]]);
        SRSRewritten = 'SRS0' + separator + hhh + separator + TT + separator + regexExtracted[2] + separator + regexExtracted[1] + '@' + senderDomain;
    }
    if (title) {
        return `${title} <${SRSRewritten}>`;
    } else {
        return SRSRewritten;
    }
}
/**
 * Unwraps and email address that is possibly SRS to get the bounce or base address
 * @public
 * @method
 * @param  {String} receievedEmailAddress 
 * @param  {Boolean} baseAddress  Whether we want the base address in the case of SRS1 or just the SRS0 version                              
 * @return {String}
 */
function reverse(receievedEmailAddress, baseAddress) {
    let title = extractTitle(receievedEmailAddress),
        email = extractEmail(receievedEmailAddress),
        regexExtracted;
    //Detect the type of email address
    if (isSRS0(email)) {
        regexExtracted = SRS0AddressRegex.exec(email);
        //Recreate the address
        email = regexExtracted[4] + '@' + regexExtracted[3];
    } else if (isSRS1(email)) {
        regexExtracted = SRS1AddressRegex.exec(email);
        //Recreate the address
        if (baseAddress) {
            email = regexExtracted[6] + '@' + regexExtracted[5];
        } else {
            var seperator = dirtyCheckSeperator(email);
            email = 'SRS0' + seperator + regexExtracted[3] + seperator + regexExtracted[4] + seperator + regexExtracted[5] + seperator + regexExtracted[6] + '@' + regexExtracted[2];
        }
    }
    //Else its just a normal email
    return combineEmail(title, email);
}
module.exports = {
    forward: forward,
    reverse: reverse,
    extractEmail: extractEmail,
    extractTitle: extractTitle,
    combineEmail: combineEmail,
    validate: function (email) {
        return isEmailRegex.test(email);
    }
};