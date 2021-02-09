# senrews

**Sender Rewriting Scheme module for emails**

https://en.wikipedia.org/wiki/Sender_Rewriting_Scheme
http://www.open-spf.org/srs/


## Installing

```bash

npm i --save senrews

```

## Public API

+ *src/index.js*

   ### Functions

   + **combineEmail**(title, emailAddress) => String

      * Combines an email address back into one. Eg Auxolust and auxolust@gmail.com => "Auxolust" <auxolust@gmail.com>*


   + **extractTitle**(emailAddress, [ *keepQuotes* ]) => String

      * Extracts the titles from email addresses*



   + **extractEmail**(emailAddress) => String

      * extractEmail Extracts the email portion of an email address ignoring titles*



   + **forward**(receievedEmailAddress, senderDomain, secret, [ *separator* ]) => String

      * Creates an SRS compliant string for your from/source of an email based on your sending domain*



   + **reverse**(receievedEmailAddress, baseAddress) => String

      * Unwraps and email address that is possibly SRS to get the bounce or base address*
 
 ### Licence

MIT
