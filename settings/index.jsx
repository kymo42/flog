function settingsComponent(props) {
    return (
        <Page>
            <Section>
                <Text bold align="center" fontSize={48}>⛳️ FLOG ⛳️</Text>
                <Text align="center" color="fb-gray">
                    Golf Rangefinder
                </Text>
            </Section>

            <Section
                title="Distance Units">
                <Toggle
                    settingsKey="useYards"
                    label="Use Yards (vs Meters)"
                />
            </Section>

            <Section
                title="Feedback">
                <Toggle
                    settingsKey="vibrationEnabled"
                    label="Vibration Feedback"
                />
            </Section>

            <Section>
                <Text align="center" color="fb-gray" fontSize={12}>
                    Manage your 4 courses directly on your watch.
                </Text>
            </Section>
        </Page>
    );
}

registerSettingsPage(settingsComponent);
