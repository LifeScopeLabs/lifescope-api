'use strict';

import express from 'express';

import EmailClient from '../../extensions/mandrill/email-client.js';
import { EmailUpdateRequestTC } from '../../../schema/models/email-update-request';
import { UserTC } from '../../../schema/models/users.js';

let router = express.Router();
let confirm = router.route('/');

let emailClient = new EmailClient();

confirm.get(async function(req, res) {
	let user;
	let query = req.query;

	try {
		let emailUpdateRequest = await EmailUpdateRequestTC.getResolver('findOne').resolve({
			filter: {
				token_string: query.token
			}
		});

		if (emailUpdateRequest == null) {
			res.redirect('/');
		}
		else {
			user = await UserTC.getResolver('findOne').resolve({
				args: {
					filter: {
						id: emailUpdateRequest.user_id.toString('hex')
					}
				}
			});

			if (user == null) {
				throw new Error('User does not exist');
			}

			let emailUpdate = UserTC.getResolver('updateOne').resolve({
				args: {
					filter: {
						id: user._id.toString('hex')
					},
					record: {
						email: emailUpdateRequest.new_email
					}
				}
			});

			let removeRequest = EmailUpdateRequestTC.getResolver('removeOne').resolve({
				args: {
					filter: {
						id: emailUpdateRequest._id.toString('hex')
					}
				}
			});

			let oldEmail = emailClient.send(user.email, {
				template: 'lifescope-email-confirm-old',
				context: {
					new_email: emailUpdateRequest.new_email
				}
			});

			let newEmail = emailClient.send(emailUpdateRequest.new_email, {
				template: 'lifescope-email-confirm-new',
				context: {
					old_email: user.email
				}
			});

			await emailUpdate;
			await removeRequest;
			await newEmail;
			await oldEmail;

			res.redirect('/settings/account');
		}
	}
	catch(err) {
		console.log(err); //eslint-disable-line no-console

		res.redirect('/');
	}
});

export default router;
