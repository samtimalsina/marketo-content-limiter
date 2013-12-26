marketo-content-limiter
=======================

A JavaScript content limiter using Marketo Forms.

In it's default settings, the content limiter will check to see a Marketo cookie exists; the content limiter is displayed if the user has not already filled up the form.

Requirements
============

This requires you to design your Marketo landing page in a certain way. Because Marketo does not allow you to upload landing pages, you will have to manaully create them.

Use Case
========

You are already using a CMS and Marketo. You need to gate your content without much fuss and you use Marketo.

There are several things you can customize:
1. Recurring [0|1|2|...]: The content limiter is displayed every nth time. This is useful if you need the users to fill a progressive Marketo form. Default is 0 (user only fills the form once.)
2. Modal [true|false]: Filling out the form is optional.
3. MarketoURL: The complete URL of the Marketo Landing page that contains the form.
