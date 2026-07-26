package com.Haat_Bazar.backup_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> generateReport() {
        Map<String, Object> report = new LinkedHashMap<>();

        // All timestamps come from MySQL directly (DATE_FORMAT) to stay in the server's
        // timezone. Never use Java LocalDateTime here — JDBC serverTimezone=UTC reads
        // datetime columns shifted by +6h, but passes LocalDateTime params as-is,
        // causing a 6-hour mismatch in WHERE comparisons.
        String generatedAt = queryString(
                "SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')");
        report.put("generatedAt", generatedAt);

        // Closed window: [since, until] = [second-most-recent backup, most-recent backup].
        // The PDF always shows exactly what was captured in the last backup run.
        // No matter when the admin downloads the PDF, the window is fixed.
        String since = null;
        String until = null;
        try {
            List<String> times = jdbcTemplate.queryForList(
                    "SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') " +
                    "FROM backup_db.backup_records ORDER BY created_at DESC LIMIT 2",
                    String.class);
            until = times.size() > 0 ? times.get(0) : null;
            since = times.size() > 1 ? times.get(1) : null;
        } catch (Exception ignored) {}

        report.put("sinceDate", since);
        // override generatedAt to show the backup time, not "now"
        if (until != null) report.put("generatedAt", until);

        // ── Users joined
        if (since != null) {
            report.put("newCustomerCount", queryLong(
                    "SELECT COUNT(*) FROM auth_db.users WHERE role='CUSTOMER' AND created_at > ? AND created_at <= ?", since, until));
            report.put("newSellerCount", queryLong(
                    "SELECT COUNT(*) FROM auth_db.users WHERE role='SELLER'  AND created_at > ? AND created_at <= ?", since, until));
            report.put("newAdminCount", queryLong(
                    "SELECT COUNT(*) FROM auth_db.users WHERE role='ADMIN'   AND created_at > ? AND created_at <= ?", since, until));
            report.put("newUsers", query(
                    "SELECT name, email, role, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as joined_at " +
                    "FROM auth_db.users WHERE created_at > ? AND created_at <= ? ORDER BY created_at DESC", since, until));
        } else if (until != null) {
            report.put("newCustomerCount", queryLong(
                    "SELECT COUNT(*) FROM auth_db.users WHERE role='CUSTOMER' AND created_at <= ?", until));
            report.put("newSellerCount", queryLong(
                    "SELECT COUNT(*) FROM auth_db.users WHERE role='SELLER'  AND created_at <= ?", until));
            report.put("newAdminCount", queryLong(
                    "SELECT COUNT(*) FROM auth_db.users WHERE role='ADMIN'   AND created_at <= ?", until));
            report.put("newUsers", query(
                    "SELECT name, email, role, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as joined_at " +
                    "FROM auth_db.users WHERE created_at <= ? ORDER BY id DESC", until));
        } else {
            report.put("newCustomerCount", queryLong("SELECT COUNT(*) FROM auth_db.users WHERE role='CUSTOMER'"));
            report.put("newSellerCount",   queryLong("SELECT COUNT(*) FROM auth_db.users WHERE role='SELLER'"));
            report.put("newAdminCount",    queryLong("SELECT COUNT(*) FROM auth_db.users WHERE role='ADMIN'"));
            report.put("newUsers", query(
                    "SELECT name, email, role, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as joined_at " +
                    "FROM auth_db.users ORDER BY id DESC"));
        }

        // ── Products added
        if (since != null) {
            report.put("newProductCount", queryLong(
                    "SELECT COUNT(*) FROM product_db.products WHERE created_at > ? AND created_at <= ?", since, until));
            report.put("newProducts", query(
                    "SELECT p.id, p.name as product_name, p.price, " +
                    "COALESCE(u.name, p.seller_email, 'Unassigned') as seller_name, " +
                    "p.seller_email, c.name as category, " +
                    "DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s') as created_at " +
                    "FROM product_db.products p " +
                    "LEFT JOIN product_db.categories c ON c.id = p.category_id " +
                    "LEFT JOIN auth_db.users u ON u.email = p.seller_email " +
                    "WHERE p.created_at > ? AND p.created_at <= ? ORDER BY p.created_at DESC", since, until));
        } else if (until != null) {
            report.put("newProductCount", queryLong(
                    "SELECT COUNT(*) FROM product_db.products WHERE created_at <= ?", until));
            report.put("newProducts", query(
                    "SELECT p.id, p.name as product_name, p.price, " +
                    "COALESCE(u.name, p.seller_email, 'Unassigned') as seller_name, " +
                    "p.seller_email, c.name as category, " +
                    "DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s') as created_at " +
                    "FROM product_db.products p " +
                    "LEFT JOIN product_db.categories c ON c.id = p.category_id " +
                    "LEFT JOIN auth_db.users u ON u.email = p.seller_email " +
                    "WHERE p.created_at <= ? ORDER BY p.id DESC", until));
        } else {
            report.put("newProductCount", queryLong("SELECT COUNT(*) FROM product_db.products"));
            report.put("newProducts", query(
                    "SELECT p.id, p.name as product_name, p.price, " +
                    "COALESCE(u.name, p.seller_email, 'Unassigned') as seller_name, " +
                    "p.seller_email, c.name as category, " +
                    "DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s') as created_at " +
                    "FROM product_db.products p " +
                    "LEFT JOIN product_db.categories c ON c.id = p.category_id " +
                    "LEFT JOIN auth_db.users u ON u.email = p.seller_email " +
                    "ORDER BY p.id DESC"));
        }

        // ── Orders placed
        if (since != null) {
            report.put("newOrderCount", queryLong(
                    "SELECT COUNT(*) FROM order_db.orders WHERE created_at > ? AND created_at <= ?", since, until));
            report.put("newRevenue", queryDouble(
                    "SELECT COALESCE(SUM(total_amount),0) FROM order_db.orders WHERE status='PAID' AND created_at > ? AND created_at <= ?", since, until));
            report.put("newOrders", query(ordersSql("o.created_at > ? AND o.created_at <= ?"), since, until));
        } else if (until != null) {
            report.put("newOrderCount", queryLong(
                    "SELECT COUNT(*) FROM order_db.orders WHERE created_at <= ?", until));
            report.put("newRevenue", queryDouble(
                    "SELECT COALESCE(SUM(total_amount),0) FROM order_db.orders WHERE status='PAID' AND created_at <= ?", until));
            report.put("newOrders", query(ordersSql("o.created_at <= ?"), until));
        } else {
            report.put("newOrderCount", queryLong("SELECT COUNT(*) FROM order_db.orders"));
            report.put("newRevenue", queryDouble(
                    "SELECT COALESCE(SUM(total_amount),0) FROM order_db.orders WHERE status='PAID'"));
            report.put("newOrders", query(ordersSql(null)));
        }

        // ── Transactions
        if (since != null) {
            report.put("newPaymentCount", queryLong(
                    "SELECT COUNT(*) FROM payment_db.payments WHERE status='SUCCESS' AND created_at > ? AND created_at <= ?", since, until));
            report.put("newPaymentAmount", queryDouble(
                    "SELECT COALESCE(SUM(amount),0) FROM payment_db.payments WHERE status='SUCCESS' AND created_at > ? AND created_at <= ?", since, until));
            report.put("newPayments", query(paymentsSql("pay.created_at > ? AND pay.created_at <= ?"), since, until));
        } else if (until != null) {
            report.put("newPaymentCount", queryLong(
                    "SELECT COUNT(*) FROM payment_db.payments WHERE status='SUCCESS' AND created_at <= ?", until));
            report.put("newPaymentAmount", queryDouble(
                    "SELECT COALESCE(SUM(amount),0) FROM payment_db.payments WHERE status='SUCCESS' AND created_at <= ?", until));
            report.put("newPayments", query(paymentsSql("pay.created_at <= ?"), until));
        } else {
            report.put("newPaymentCount", queryLong(
                    "SELECT COUNT(*) FROM payment_db.payments WHERE status='SUCCESS'"));
            report.put("newPaymentAmount", queryDouble(
                    "SELECT COALESCE(SUM(amount),0) FROM payment_db.payments WHERE status='SUCCESS'"));
            report.put("newPayments", query(paymentsSql(null)));
        }

        return report;
    }

    private String ordersSql(String whereClause) {
        String base =
            "SELECT o.id as order_id, " +
            "COALESCE(uc.name,'Deleted User') as customer_name, " +
            "COALESCE(uc.email,'unknown') as customer_email, " +
            "p.name as product_name, " +
            "COALESCE(us.name, p.seller_email, 'Unassigned') as seller_name, " +
            "oi.quantity, oi.price, (oi.quantity * oi.price) as line_total, " +
            "o.status, DATE_FORMAT(o.created_at,'%Y-%m-%d %H:%i:%s') as created_at " +
            "FROM order_db.orders o " +
            "LEFT JOIN auth_db.users uc ON uc.id = o.user_id " +
            "JOIN order_db.order_items oi ON oi.order_id = o.id " +
            "LEFT JOIN product_db.products p ON p.id = oi.product_id " +
            "LEFT JOIN auth_db.users us ON us.email = p.seller_email";
        return whereClause != null
            ? base + " WHERE " + whereClause + " ORDER BY o.created_at DESC"
            : base + " ORDER BY o.created_at DESC";
    }

    private String paymentsSql(String whereClause) {
        String base =
            "SELECT pay.id, pay.order_id, " +
            "COALESCE(u.name,'Deleted User') as customer_name, " +
            "COALESCE(u.email,'unknown') as customer_email, " +
            "pay.amount, pay.method, pay.status, " +
            "DATE_FORMAT(pay.created_at,'%Y-%m-%d %H:%i:%s') as created_at " +
            "FROM payment_db.payments pay " +
            "LEFT JOIN auth_db.users u ON u.id = pay.user_id";
        return whereClause != null
            ? base + " WHERE " + whereClause + " ORDER BY pay.created_at DESC"
            : base + " ORDER BY pay.created_at DESC";
    }

    private List<Map<String, Object>> query(String sql, Object... params) {
        try {
            return params.length > 0
                ? jdbcTemplate.queryForList(sql, params)
                : jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            return List.of();
        }
    }

    private Long queryLong(String sql, Object... params) {
        try {
            Long val = params.length > 0
                ? jdbcTemplate.queryForObject(sql, Long.class, params)
                : jdbcTemplate.queryForObject(sql, Long.class);
            return val != null ? val : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    private Double queryDouble(String sql, Object... params) {
        try {
            Double val = params.length > 0
                ? jdbcTemplate.queryForObject(sql, Double.class, params)
                : jdbcTemplate.queryForObject(sql, Double.class);
            return val != null ? val : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String queryString(String sql, Object... params) {
        try {
            return params.length > 0
                ? jdbcTemplate.queryForObject(sql, String.class, params)
                : jdbcTemplate.queryForObject(sql, String.class);
        } catch (Exception e) {
            return null;
        }
    }
}
