function settingsComponent(props) {
    return (
        <Page>
            <Section
                title="Golf Rangefinder Settings">
                <Toggle
                    settingsKey="useYards"
                    label="Use Yards (vs Meters)"
                />
                <Toggle
                    settingsKey="vibrationEnabled"
                    label="Vibration Feedback"
                />
                <Toggle
                    settingsKey="autoAdvanceHole"
                    label="Auto-advance Hole"
                />
            </Section>
        </Page>
    );
}

registerSettingsPage(settingsComponent);
