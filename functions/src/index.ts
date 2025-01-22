/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

// Common configuration for all functions
const functionConfig = {
  cors: true,
  region: 'us-west1',
  enforceAppCheck: false,
  timeoutSeconds: 60,
  memory: '256MiB'
} as const;

// Types
interface Collaboration {
  inviterId: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SendInviteData {
  inviteeEmail: string;
  role: string;
}

interface AcceptInviteData {
  collaborationId: string;
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Send collaboration invite
export const sendCollaborationInvite = onCall(functionConfig, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new Error('Must be authenticated to invite collaborators');
  }

  const { inviteeEmail, role } = request.data as SendInviteData;
  const inviterId = request.auth.uid;

  // Validate input
  if (!inviteeEmail || !role) {
    throw new Error('Missing required fields');
  }

  try {
    // Check if user is already registered
    const userRecord = await admin.auth().getUserByEmail(inviteeEmail).catch(() => null);
    
    // Generate action code settings
    const actionCodeSettings = {
      url: `https://insurance-claim-assistant.web.app/accept-invite`,
      handleCodeInApp: true,
    };

    // Try to send the email first
    try {
      if (userRecord) {
        // User exists - send custom email with collaboration invite
        await admin.auth().generateSignInWithEmailLink(
          inviteeEmail,
          actionCodeSettings
        );
      } else {
        // New user - send email for account creation
        await admin.auth().generateSignInWithEmailLink(
          inviteeEmail,
          actionCodeSettings
        );
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      throw new Error('Failed to send invitation email. Please try again.');
    }

    // Only create the collaboration document if email was sent successfully
    const now = new Date();
    const collaborationData: Collaboration = {
      inviterId,
      inviteeEmail,
      status: 'pending',
      role,
      createdAt: now,
      updatedAt: now,
    };

    const collaborationRef = await db.collection('collaborations').add(collaborationData);

    return { success: true, collaborationId: collaborationRef.id };
  } catch (error) {
    console.error('Error in collaboration invite process:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Error sending collaboration invite');
  }
});

// Accept collaboration invite
export const acceptCollaborationInvite = onCall(functionConfig, async (request) => {
  if (!request.auth) {
    throw new Error('Must be authenticated to accept invites');
  }

  const { collaborationId } = request.data as AcceptInviteData;
  const acceptingUserId = request.auth.uid;

  try {
    // Get collaboration document
    const collaborationDoc = await db.collection('collaborations').doc(collaborationId).get();
    
    if (!collaborationDoc.exists) {
      throw new Error('Collaboration not found');
    }

    const collaboration = collaborationDoc.data() as Collaboration;

    // Verify the accepting user is the invitee
    const userRecord = await admin.auth().getUser(acceptingUserId);
    if (userRecord.email !== collaboration.inviteeEmail) {
      throw new Error('You are not the invited user');
    }

    // Update collaboration status
    await collaborationDoc.ref.update({
      status: 'accepted',
      updatedAt: new Date(),
    });

    // Update both users' documents with the collaboration
    const batch = db.batch();

    // Update inviter's document
    const inviterRef = db.collection('users').doc(collaboration.inviterId);
    batch.set(inviterRef, {
      collaborations: {
        [acceptingUserId]: {
          role: 'owner',
          status: 'active'
        }
      }
    }, { merge: true });

    // Update accepter's document
    const accepterRef = db.collection('users').doc(acceptingUserId);
    batch.set(accepterRef, {
      collaborations: {
        [collaboration.inviterId]: {
          role: collaboration.role,
          status: 'active'
        }
      }
    }, { merge: true });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error accepting collaboration:', error);
    if (error instanceof Error) {
      throw new Error(`Error accepting collaboration: ${error.message}`);
    }
    throw new Error('Error accepting collaboration');
  }
});

// Get user's collaborations
export const getCollaborations = onCall(functionConfig, async (request) => {
  if (!request.auth) {
    throw new Error('Must be authenticated to view collaborations');
  }

  try {
    const userId = request.auth.uid;
    
    // Get collaborations where user is inviter
    const sentInvites = await db.collection('collaborations')
      .where('inviterId', '==', userId)
      .get();

    // Get collaborations where user is invitee
    const userRecord = await admin.auth().getUser(userId);
    const receivedInvites = await db.collection('collaborations')
      .where('inviteeEmail', '==', userRecord.email)
      .get();

    const collaborations = {
      sent: sentInvites.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      received: receivedInvites.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    };

    return collaborations;
  } catch (error) {
    console.error('Error getting collaborations:', error);
    if (error instanceof Error) {
      throw new Error(`Error retrieving collaborations: ${error.message}`);
    }
    throw new Error('Error retrieving collaborations');
  }
});

// Test email sending via HTTP
export const testEmailSendHttp = onRequest(async (request, response) => {
  // Enable CORS
  cors({ origin: true })(request, response, async () => {
    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      // Email options
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: 'bhavyanshsabharwal@gmail.com',
        subject: 'Test Email from Insurance Claim Assistant',
        html: `
          <h1>Welcome to Insurance Claim Assistant</h1>
          <p>This is a test email to verify the email sending functionality.</p>
          <p>Click <a href="http://localhost:5173">here</a> to visit the application.</p>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);
      response.json({ success: true, message: 'Test email sent successfully' });
    } catch (error) {
      console.error('Error sending test email:', error);
      response.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send test email' 
      });
    }
  });
});
