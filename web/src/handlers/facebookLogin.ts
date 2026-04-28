import { getFacebookAuthUrl } from '../services/facebook';

export async function redirectToFacebookAuth(): Promise<void> {
    const url = await getFacebookAuthUrl();
    window.location.href = url;
}
