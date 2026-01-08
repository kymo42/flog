function settingsComponent(props) {
    return (
        <Page>
            <Section
                title="Active Course">
                <TextInput
                    label="Course Name"
                    settingsKey="courseName"
                />
            </Section>

            <Section
                title="Share Course">
                <Text italic color="fb-blue">
                    Copy this code to share your current course with a friend.
                </Text>
                <TextInput
                    label="Export Code"
                    settingsKey="courseExportCode"
                    disabled={true}
                />
            </Section>

            <Section
                title="Import Course">
                <Text italic color="fb-green">
                    Paste a code from a friend here to load their course.
                </Text>
                <TextInput
                    label="Paste Code Here"
                    settingsKey="courseImportCode"
                />
            </Section>

            <Section
                title="App Settings">
                <Toggle
                    settingsKey="useYards"
                    label="Use Yards (vs Meters)"
                />
                <Toggle
                    settingsKey="vibrationEnabled"
                    label="Vibration Feedback"
                />
            </Section>
        </Page>
    );
}

registerSettingsPage(settingsComponent);
