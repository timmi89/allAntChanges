import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.WebElement;

public class SimpleTests extends AbstractWidgetTests {

    public static String url = "http://localhost:3000/pages/simple/page.html";

    @Test
    public void testSummaryWidgetLocation() {
        driver.get(url);
        WebElement element;

        element = findByXpath(String.format("//div[contains(@class,'%s')]", AntennaConstants.CLASS_SUMMARY_WIDGET));
        Assert.assertNotNull("summary widget not found", element);

        element = findByXpath(String.format("//div[contains(@class, 'summary')]/following-sibling::div[contains(@class,'%s')]", AntennaConstants.CLASS_SUMMARY_WIDGET));
        Assert.assertNotNull("summary not found in expected location", element);
    }

    @Test
    public void testTextIndicatorLocation() {
        driver.get(url);
        WebElement element;

        element = findByXpath("//p");
        Assert.assertNotNull("p tag not found", element);

        element = findByXpath(String.format("//p/span[contains(@class,'%s')]", AntennaConstants.CLASS_TEXT_INDICATOR));
        Assert.assertNotNull("text indicator not found in expected location", element);
    }

}