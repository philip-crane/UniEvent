package dk.unievent.app.infrastructure.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaginationConstantsConfigTests {

    @Test
    void defaultPageSizeShouldBe20() {
        PaginationConstantsConfig config = new PaginationConstantsConfig();
        assertEquals(20, config.getDefaultPageSize());
    }

    @Test
    void maxPageSizeShouldBe100() {
        PaginationConstantsConfig config = new PaginationConstantsConfig();
        assertEquals(100, config.getMaxPageSize());
    }

    @Test
    void setDefaultPageSizeShouldUpdateValue() {
        PaginationConstantsConfig config = new PaginationConstantsConfig();
        config.setDefaultPageSize(50);
        assertEquals(50, config.getDefaultPageSize());
    }

    @Test
    void setMaxPageSizeShouldUpdateValue() {
        PaginationConstantsConfig config = new PaginationConstantsConfig();
        config.setMaxPageSize(200);
        assertEquals(200, config.getMaxPageSize());
    }
}
