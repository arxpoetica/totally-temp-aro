package com.altvil.aro.persistence;

import com.opencsv.CSVReader;
import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.usertype.UserType;

import java.io.IOException;
import java.io.Serializable;
import java.io.StringReader;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Custom Hibernate {@link UserType} used to convert between a {@link Map}
 * and PostgreSQL {@code hstore} data type.
 */
public class HstoreUserType implements UserType {

    /**
     * The PostgreSQL value for the {@code hstore} data type.
     */
    public static final int HSTORE_TYPE = 1111;
    /**
     * PostgreSQL {@code hstore} field separator token.
     */
    private static final String HSTORE_SEPARATOR_TOKEN = "=>";
    /**
     * {@link Pattern} used to find and split {@code hstore} entries.
     */
    private static final Pattern HSTORE_ENTRY_PATTERN = Pattern.compile(String.format("\"(.*)\"%s\"(.*)\"", HSTORE_SEPARATOR_TOKEN));

    public int[] sqlTypes() {
        return new int[]{HSTORE_TYPE};
    }

    @SuppressWarnings("rawtypes")
    public Class returnedClass() {
        return Map.class;
    }

    public boolean equals(final Object x, final Object y) throws HibernateException {
        if (x == null)
            return y == null;
        return x.equals(y);
    }

    public int hashCode(final Object x) throws HibernateException {
        return x.hashCode();
    }

    public Object nullSafeGet(final ResultSet rs, final String[] names,
                              final SessionImplementor session, final Object owner)
            throws HibernateException, SQLException {
        return convertToEntityAttribute(rs.getString(names[0]));
    }

    @SuppressWarnings("unchecked")
    public void nullSafeSet(final PreparedStatement st, final Object value, final int index,
                            final SessionImplementor session) throws HibernateException, SQLException {
        st.setObject(index, convertToDatabaseColumn((Map<String, Object>) value), HSTORE_TYPE);

    }

    @SuppressWarnings("unchecked")
    public Object deepCopy(final Object value) throws HibernateException {
        if (value != null)
            return new HashMap<String, Object>(((Map<String, Object>) value));
        else
            return null;
    }

    public boolean isMutable() {
        return true;
    }

    public Serializable disassemble(final Object value) throws HibernateException {
        return (Serializable) value;
    }

    public Object assemble(final Serializable cached, final Object owner)
            throws HibernateException {
        return cached;
    }

    public Object replace(final Object original, final Object target, final Object owner)
            throws HibernateException {
        return original;
    }


    private String convertToDatabaseColumn(final Map<String, Object> attribute) {
        if (attribute != null) {
            final StringBuilder builder = new StringBuilder();
            for (final Map.Entry<String, Object> entry : attribute.entrySet()) {
                if (builder.length() > 1) {
                    builder.append(", ");
                }
                builder.append("\"");
                builder.append(entry.getKey());
                builder.append("\"");
                builder.append(HSTORE_SEPARATOR_TOKEN);
                builder.append("\"");
                builder.append(entry.getValue().toString());
                builder.append("\"");
            }
            return builder.toString();
        } else {
            return null;
        }
    }

    private Map<String, Object> convertToEntityAttribute(final String dbData) {
        if (dbData != null) {
            final Map<String, Object> data = new HashMap<String, Object>();
            final CSVReader reader = new CSVReader(new StringReader(dbData));

            String[] tokens;
            try {
                while ((tokens = reader.readNext()) != null) {
                    for (String token : tokens) {
                        final Matcher matcher = HSTORE_ENTRY_PATTERN.matcher('"' + token + '"');
                        if (matcher.find()) {
                            data.put(matcher.group(1), matcher.group(2));
                        }
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            return data;
        } else {
            return null;
        }

    }
}