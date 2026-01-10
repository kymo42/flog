function settingsComponent(props) {
    const courseList = props.settingsStorage.getItem("courseList");
    let courses = [];
    if (courseList) {
        try {
            courses = JSON.parse(courseList);
        } catch (e) {
            console.error("Failed to parse courseList");
        }
    }

    return (
        <Page>
            <Section
                title="Course Management">
                {courses.map((course, index) => (
                    <Section key={course.id} title={`Course ${index + 1}`}>
                        <TextInput
                            label="Name"
                            value={course.name}
                            onChange={(value) => {
                                // Send rename
                                props.settingsStorage.setItem("renameCourse", JSON.stringify({ id: course.id, name: value }));
                            }}
                        />
                        <Button
                            label="Delete"
                            onClick={() => {
                                props.settingsStorage.setItem("deleteCourse", course.id);
                            }}
                        />
                    </Section>
                ))}
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
