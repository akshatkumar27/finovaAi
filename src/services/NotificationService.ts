import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
    async requestUserPermission() {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const settings = await notifee.requestPermission();
            if (settings.authorizationStatus >= 1) {
                console.log('Permission settings:', settings);
            } else {
                console.log('User declined permissions');
                return;
            }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Authorization status:', authStatus);
            this.getFCMToken();
        }
    }

    async getFCMToken() {
        try {
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                console.log('Your Firebase Token is:', fcmToken);
                return fcmToken;
            } else {
                console.log('Failed', 'No token received');
                return null;
            }
        } catch (error) {
            console.log('Error fetching token:', error);
            return null;
        }
    }

    async createChannel() {
        await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
        });
    }

    async displayNotification(title: string, body: string) {
        await this.createChannel();
        await notifee.displayNotification({
            title,
            body,
            android: {
                channelId: 'default',
                smallIcon: 'ic_launcher', // verify if this icon exists or use a default
                pressAction: {
                    id: 'default',
                },
            },
        });
    }

    setupForegroundHandler() {
        return messaging().onMessage(async remoteMessage => {
            console.log('A new FCM message arrived!', remoteMessage);
            if (remoteMessage.notification) {
                this.displayNotification(
                    remoteMessage.notification.title || 'New Notification',
                    remoteMessage.notification.body || ''
                );
            }
        });
    }

    setupBackgroundHandler() {
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background!', remoteMessage);
            if (remoteMessage.notification) {
                this.displayNotification(
                    remoteMessage.notification.title || 'New Notification',
                    remoteMessage.notification.body || ''
                );
            }
        });
    }
}

export const notificationService = new NotificationService();
