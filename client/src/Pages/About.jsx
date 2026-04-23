import MobileLayout from "../Components/MobileLayout"
import Row from "../Components/Row.jsx"
import Card from "../Components/Card.jsx"
import SectionLabel from "../Components/SectionLabel.jsx"

function About() {
    return (
        <MobileLayout>
            <div className="p-4 pb-24">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">How to use this app</h1>
                    <p className="text-sm text-gray-400 mt-1">A Quick guide to get you started</p>
                </div>
                <SectionLabel label="Getting Started"/>
                <Card>
                    <Row
                        icon="🔑"
                        color="bg-purpl-50"
                        title="Sign in with Google"
                        desc='Tap "Sign in with Google" on the login screen and choose your account. You will be redirected into the app automatically.'
                    />
                    <Row
                        icon="👤"
                        color="bg-teal-50"
                        title="Update your profile"
                        desc="Go to Profile → tap Edit to change your name or photo. Tap save when done."
                    />
                </Card>
                <SectionLabel label="Chatting" />
                <Card>
                    <Row
                        icon="💬"
                        color="bg-purple-50"
                        title="Send a message"
                        desc="Open a chat, type in the box, and press send."
                    />
                    <Row
                        icon="🖼️"
                        color="bg-teal-50"
                        title="Send an Image"
                        desc="Tap the image icon, choose a photo, then send. For a view-once image, user 'Add View Once Image' - it disappears after the receiver views it."
                    />
                    <Row
                        icon="📍"
                        color="bg-amber-50"
                        title="Share your location"
                        desc="Tap the location ion in a chat, confirm, and allow browser permission. The receiver can tap it to open maps."
                    />
                    <Row
                        icon="✏️"
                        color="bg-purple-50"
                        title="Edit or Delete Your message"
                        desc="Long-Press (~1s) your own message to edit or delete it. Deleted messages show as 'Message Deleted'."
                    />
                    <Row
                        icon="😂"
                        color="bg-teal-50"
                        title="React to Message"
                        desc="Double-click any message to pick an emoji reaction."
                        last
                    />
                </Card>
                <SectionLabel label="Privacy" />
                <Card>
                    <Row
                        icon="🔒"
                        color="bg-red-50"
                        title="Lock a chat with PIN"
                        desc="Long-press a friend in the chat list for 0.7s → set a numeric PIN (4-6 digits). The chat shows a lock icon. Tap it and enter the PIN to open "
                    />
                    <Row
                        icon="🔓"
                        color="bg-gray-100"
                        title="Remove a lock"
                        desc="Long-press the locked friend again → Choose 'Remove Lock' → enter your PIN"
                        last
                    />
                </Card>
                <SectionLabel label="Friends and Group" />
                <Card>
                    <Row
                        icon="➕"
                        color="bg-teal-50"
                        title="Add a friend"
                        desc="Go to Friends → Enter their email → Send request. They can accept or reject from their friends page."
                    />
                    <Row
                        icon="👥"
                        color="bg-purple-50"
                        title="Groups"
                        desc="Create a group from the Group page. Admins can add/remove members and change roles"
                    />
                </Card>
                <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-xs text-gray-500 leading-relaxed">
                    Use personal or mobile data - some corporate networks block connections needed by this app. Avoid incognito/private mode as it may block login cookies.
                </div>
            </div>
        </MobileLayout>
    )
}

export default About