import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.Point;
import org.openqa.selenium.WebElement;

import java.util.Iterator;
import java.util.List;

public class SimpleTests extends AbstractWidgetTests {

    public static final String url = "http://localhost:3000/pages/simple/page.html";

    @Test
    public void testSummaryWidgetTitle() {
        driver.get(url);
        WebElement element;

        element = findByXpath(String.format("//span[contains(@class,'%s')]", AntennaConstants.CLASS_SUMMARY_TITLE));
        Assert.assertNotNull("summary widget title not found", element);

        Assert.assertEquals("wrong summary widget title", "3 Reactions", element.getText());
    }

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

    @Test
    public void testImageIndicatorLocation() {
        driver.get(url);
        WebElement image = findByXpath("//img");
        Assert.assertNotNull("img tag not found", image);

        assertMediaIndicatorOverElement(image);
    }

    @Test
    public void testVideoIndicatorLocation() {
        driver.get(url);

        WebElement video = findByXpath("//iframe");
        Assert.assertNotNull("iframe tag not found", video);

        assertMediaIndicatorOverElement(video);
    }

    @Test
    public void testMediaIndicatorCorner() {
        driver.get(url);

        WebElement image = findByXpath("//img");
        Assert.assertNotNull("img tag not found", image);

        doTestMediaCorner(image, "bottom right", "bottom-right");
        doTestMediaCorner(image, "top right", "top-right");
        doTestMediaCorner(image, "top left", "top-left");
        doTestMediaCorner(image, "bottom left", "bottom-left");
    }

    public void doTestMediaCorner(WebElement element, String corner, String buttonId) {
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        assertMediaIndicatorOverElement(element, corner);
    }

}